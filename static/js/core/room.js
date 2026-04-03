// 修正版 room.js（ボタン位置調整済 / 再接続対応・巻き添え防止 / id管理修正 / join.html 連携対応）

import { startQuizHost } from "/static/js/quiz/quiz-host.js";
import { startQuizPlayer } from "/static/js/quiz/quiz-player.js";
import { startNASAHost } from "/static/js/nasa/nasa-host.js";
import { startNASAPlayer } from "/static/js/nasa/nasa-player.js";

const params = new URLSearchParams(location.search);
const roomId = params.get("room");
let myName = params.get("name") || "";
let myId = params.get("id") || "";  // join.html からのIDを受け取る
let hostName = "";
let lastMembers = [];
let joined = false;
let missingCount = 0;

const baseURL = location.origin;

// =====================
// 参加処理
// =====================
async function loadRoom() {
  const res = await fetch(`${baseURL}/room/${roomId}?name=${encodeURIComponent(myName)}&id=${encodeURIComponent(myId)}`);
  if (!res.ok) return;

  const data = await res.json();
  hostName = data.host;
  if (!myName) myName = hostName;

  document.body.style.backgroundImage = `url('/static/themes/${data.theme}.jpg')`;
  document.getElementById("room-title").textContent = `${data.room}（親：${data.host}さん）`;
  document.getElementById("room-id").textContent = roomId;

  if (myName === hostName) {
    document.getElementById("host-area").style.display = "block";
    document.getElementById("gameSelectBtn").style.display = "inline-block";

    // 全体メッセージボタンを遊び選択ボタン横に表示
    const msgBtn = document.getElementById("msgAllBtn");
    if (msgBtn) {
      msgBtn.style.display = "inline-block";
      msgBtn.onclick = sendMessageToAll;
    }

    // メンバー横のコピーで参加ボタンを表示
    const copyBtn = document.getElementById("copyJoinBtn");
    if (copyBtn) copyBtn.style.display = "inline-block";
  }

  const joinURL = window.location.origin + "/static/join.html?room=" + roomId;
  document.getElementById("join-url").value = joinURL;

  if (typeof QRCode !== "undefined") {
    new QRCode(document.getElementById("qrcode"), joinURL);
  }

  if (myName !== hostName && !joined) {
    joined = true;
    try {
      await fetch(`${baseURL}/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: myName, id: myId })  // join.html 連携
      });
    } catch (e) {
      console.error("参加処理でエラー", e);
    }
  }
}

// =====================
// メンバー更新
// =====================
async function updateMembers() {
  try {
    const res = await fetch(`${baseURL}/room/${roomId}/members`);
    if (!res.ok) return;

    const data = await res.json();

    if (myName !== hostName && joined) {
      if (!data.members.includes(myName)) {
        missingCount++;
        if (missingCount >= 2) {
          location.href = "/static/kick.html";
          return;
        }
      } else {
        missingCount = 0;
      }
    }

    document.getElementById("count").textContent = data.count;

    const joinedList = data.members.filter(m => !lastMembers.includes(m));
    const leftList = lastMembers.filter(m => !data.members.includes(m));

    joinedList.forEach(m => {
      if (m !== myName && m !== hostName) showPopup(`${m}さんが入室しました`);
    });
    leftList.forEach(m => {
      if (m !== myName) showPopup(`${m}さんが退出しました`);
    });

    lastMembers = [...data.members];

    const list = [];
    list.push(`<strong>${hostName} (親)</strong>`);

    if (myName === hostName) {
      data.members.forEach(m => {
        if (m === hostName) return;
        const msgId = `msgBtn_${m}`;
        const kickId = `kickBtn_${m}`;
        list.push(`
          ・${m}
          <button id="${msgId}" class="msgBtn" data-target="${m}">💬</button>
          <button id="${kickId}" class="kickBtn" data-target="${m}">退室</button>
        `);
      });
    } else {
      list.push(`・${myName} (自分)`);
      data.members.forEach(m => {
        if (m === hostName || m === myName) return;
        list.push(`・${m}`);
      });
    }

    document.getElementById("members").innerHTML = list.join("<br>");

    // ★ id付きボタンを安全に取得してイベント登録
    data.members.forEach(m => {
      if (m === hostName || m === myName) return;

      const msgBtn = document.getElementById(`msgBtn_${m}`);
      if (msgBtn) msgBtn.onclick = () => sendMessageTo(m);

      const kickBtn = document.getElementById(`kickBtn_${m}`);
      if (kickBtn) kickBtn.onclick = () => kickMember(m);
    });
  } catch (e) {
    console.error("メンバー更新エラー", e);
  }
}

// =====================
// 退室・Kick
// =====================
async function kickMember(name) {
  if (!confirm(`${name}さんを退室させますか？`)) return;

  await fetch(`${baseURL}/room/${roomId}/kick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
}

async function exitRoom() {
  if (!confirm("退室しますか？")) return;

  if (myName !== hostName) {
    await fetch(`${baseURL}/room/${roomId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: myName })
    });
  } else {
    const res = await fetch(`${baseURL}/room/${roomId}/members`);
    if (res.ok) {
      const data = await res.json();
      for (const m of data.members) {
        if (m !== hostName) {
          await fetch(`${baseURL}/room/${roomId}/kick`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: m })
          });
        }
      }
    }
  }

  location.href = "/static/kick.html";
}

// =====================
// ユーティリティ
// =====================
function toggleMembers() {
  const box = document.getElementById("members");
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function showPopup(text) {
  const popup = document.getElementById("popup");
  popup.textContent = text;
  popup.style.display = "block";
  setTimeout(() => popup.style.display = "none", 3000);
}

function copyURL() {
  const input = document.getElementById("join-url");
  navigator.clipboard.writeText(input.value);
  showPopup("参加URLをコピーしました");
}

function sendMessageToAll() {
  const text = prompt("全員に送るメッセージ");
  if (!text) return;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "host_message",
      text: text
    }));
  }
}

function sendMessageTo(name) {
  const text = prompt(`${name}さんに送るメッセージ`);
  if (!text) return;

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: "host_message",
      text: text,
      target: name
    }));
  }
}

/* ===== 遊び選択 ===== */
function selectGame(type) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket未接続");
    return;
  }

  const gameDropdown = document.getElementById("gameDropdown");
  if (gameDropdown) gameDropdown.style.display = "none";

  const container = document.getElementById("game-container");

  if (type === "quiz") {
    if (myName === hostName) {
      currentGame = "quiz";
      socket.send(JSON.stringify({ type: "start_quiz" }));
      container.classList.add("active");
      startQuizHost(socket, container);
      document.getElementById("exitQuizBtn").style.display = "inline-block";
    }
  }

  if (type === "nasa") {
    if (myName === hostName) {
      currentGame = "nasa";
      socket.send(JSON.stringify({ type: "start_nasa" }));
      container.classList.add("active");
      startNASAHost(socket, container);
      document.getElementById("exitQuizBtn").style.display = "inline-block";
    }
  }
}

let socket;
let currentGame = null;

// =====================
// WebSocket 接続（再接続対応）
// =====================
function connectSocket() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${location.host}/ws/${roomId}`);

  socket.onopen = () => {
    console.log("WebSocket connected");
    window.socket = socket;
  };

  socket.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }

    if (msg.type === "host_message") {
      if (msg.target && msg.target !== myName) return;
      showPopup("📩 親： " + msg.text);
    }

    if (msg.type === "start_quiz") {
      const container = document.getElementById("game-container");
      container.classList.add("active");
      document.getElementById("exitQuizBtn").style.display = "inline-block";
      if (myName !== hostName) startQuizPlayer(socket, container);
    }

    if (msg.type === "start_nasa") {
      const container = document.getElementById("game-container");
      container.classList.add("active");
      document.getElementById("exitQuizBtn").style.display = "inline-block";
      if (myName !== hostName) startNASAPlayer(socket, container);
    }

    if (msg.type === "end_quiz" || msg.type === "end_nasa") {
      const container = document.getElementById("game-container");
      container.classList.remove("active");
      container.innerHTML = "";
      document.getElementById("exitQuizBtn").style.display = "none";
      if (window.removeProgressUI) window.removeProgressUI();
      currentGame = null;
    }
  };

  socket.onerror = (e) => console.error("WebSocket error", e);

  socket.onclose = () => {
    console.log("WebSocket closed, attempting reconnect in 2s...");
    setTimeout(connectSocket, 2000);
  };
}

/* クリック検知 */
document.addEventListener("click", (e) => {
  const gameDropdown = document.getElementById("gameDropdown");
  const nasaBtn = document.getElementById("nasaBtn");
  const quizBtn = document.getElementById("quizBtn");

  if (nasaBtn && nasaBtn.contains(e.target)) {
    e.stopPropagation();
    selectGame("nasa");
    return;
  }

  if (quizBtn && quizBtn.contains(e.target)) {
    e.stopPropagation();
    selectGame("quiz");
    return;
  }

  if (gameDropdown && !gameDropdown.contains(e.target) && !e.target.closest("#gameSelectBtn")) {
    gameDropdown.style.display = "none";
  }
});

/* 初期起動 */
window.addEventListener("DOMContentLoaded", () => {
  const gameBtn = document.getElementById("gameSelectBtn");
  const gameDropdown = document.getElementById("gameDropdown");
  const exitQuizBtn = document.getElementById("exitQuizBtn");

  if (gameBtn) {
    gameBtn.onclick = (e) => {
      e.stopPropagation();
      gameDropdown.style.display = gameDropdown.style.display === "block" ? "none" : "block";
    };
  }

  if (exitQuizBtn) {
    exitQuizBtn.onclick = () => {
      if (currentGame && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: `end_${currentGame}` }));
      }

      const container = document.getElementById("game-container");
      container.classList.remove("active");
      container.innerHTML = "";
      exitQuizBtn.style.display = "none";
      if (window.removeProgressUI) window.removeProgressUI();
      currentGame = null;
    };
  }

  connectSocket();

  loadRoom().then(() => {
    updateMembers();
    setInterval(updateMembers, 2000);
  });
});

window.copyURL = copyURL;
window.selectGame = selectGame;
window.toggleMembers = toggleMembers;
window.exitRoom = exitRoom;
window.kickMember = kickMember;

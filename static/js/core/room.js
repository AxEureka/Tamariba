// room.js 完全版（親・同名子対応・ID基準統一・NASA起動修正版）
import { startQuizHost } from "/static/js/quiz/quiz-host.js";
import { startQuizPlayer } from "/static/js/quiz/quiz-player.js";
import { startNASAHost } from "../nasa/nasa-host.js"; // 相対パス要確認
import { startNASAPlayer } from "/static/js/nasa/nasa-player.js";

console.log("startNASAHost", startNASAHost); // undefined でなければ OK

const params = new URLSearchParams(location.search);
const roomId = params.get("room");
let myName = params.get("name") || "";
let myId = params.get("id") || "";
if (!myId) myId = crypto.randomUUID();

let hostName = "";
let hostId = "";
let lastMembers = [];
let joined = false;
let missingCount = 0;
const baseURL = location.origin;
let socket;
let currentGame = null;

// =====================
// ルームロード
// =====================
async function loadRoom() {
  const res = await fetch(`${baseURL}/room/${roomId}?name=${encodeURIComponent(myName)}&id=${encodeURIComponent(myId)}`);
  if (!res.ok) return;

  const data = await res.json();
  hostName = data.host;
  hostId = data.hostId || hostName;
  if (!myName) myName = hostName;

  document.body.style.backgroundImage = `url('/static/themes/${data.theme}.jpg')`;
  document.getElementById("room-title").textContent = `${data.room}（親：${data.host}さん）`;
  document.getElementById("room-id").textContent = roomId;

  if (myName === hostName) {
    document.getElementById("host-area").style.display = "block";
    document.getElementById("gameSelectBtn").style.display = "inline-block";
    const msgBtn = document.getElementById("msgAllBtn");
    if (msgBtn) { msgBtn.style.display = "inline-block"; msgBtn.onclick = sendMessageToAll; }
    const copyBtn = document.getElementById("copyJoinBtn");
    if (copyBtn) copyBtn.style.display = "inline-block";
  }

  const joinURL = `${window.location.origin}/static/join.html?room=${roomId}`;
  document.getElementById("join-url").value = joinURL;
  if (typeof QRCode !== "undefined") new QRCode(document.getElementById("qrcode"), joinURL);

  if (myName !== hostName && !joined) {
    try {
      await fetch(`${baseURL}/room/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: myName, id: myId })
      });
      joined = true;
    } catch (e) { console.error("参加処理でエラー", e); }
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

    const memberObj = data.members.map(m => ({id: m.id, name: m.name}));

    if (myId !== hostId && joined) {
      const found = memberObj.some(m => m.id === myId);
      if (!found) { missingCount++; if (missingCount >= 2) { location.href = "/static/kick.html"; return; } }
      else missingCount = 0;
    }

    const joinedList = memberObj.filter(m => !lastMembers.some(lm => lm.id === m.id));
    const leftList = lastMembers.filter(lm => !memberObj.some(m => m.id === lm.id));
    joinedList.forEach(m => { if (m.id !== myId && m.id !== hostId) showPopup(`${m.name}さんが入室しました`); });
    leftList.forEach(m => { if (m.id !== myId) showPopup(`${m.name}さんが退出しました`); });

    lastMembers = [...memberObj];

    const list = [];
    list.push(`<strong>${hostName} (親)</strong>`);

    if (myId === hostId) {
      memberObj.forEach(m => {
        if (m.id === hostId) return;
        const msgId = `msgBtn_${m.id}`;
        const kickId = `kickBtn_${m.id}`;
        list.push(`・${m.name} <button id="${msgId}" class="msgBtn" data-target="${m.id}">💬</button> <button id="${kickId}" class="kickBtn" data-target="${m.id}">退室</button>`);
      });
    } else {
      list.push(`・${myName} (自分)`);
      memberObj.forEach(m => { if (m.id !== hostId && m.id !== myId) list.push(`・${m.name}`); });
    }

    document.getElementById("members").innerHTML = list.join("<br>");
    document.getElementById("count").textContent = memberObj.length;

    memberObj.forEach(m => {
      if (m.id === hostId || m.id === myId) return;
      const msgBtn = document.getElementById(`msgBtn_${m.id}`);
      if (msgBtn) msgBtn.onclick = () => sendMessageToId(m.id);
      const kickBtn = document.getElementById(`kickBtn_${m.id}`);
      if (kickBtn) kickBtn.onclick = () => kickMember(m.id);
    });

  } catch (e) { console.error("メンバー更新エラー", e); }
}

// =====================
// 退室・Kick
// =====================
async function kickMember(id) {
  const text = prompt(`退室させたい場合、確認のためEnterでOK`);
  if (text === null) return;
  await fetch(`${baseURL}/room/${roomId}/kick`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
}

async function exitRoom() {
  if (!confirm("退室しますか？")) return;

  if (myId !== hostId) {
    await fetch(`${baseURL}/room/${roomId}/kick`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: myId }) });
  } else {
    const res = await fetch(`${baseURL}/room/${roomId}/members`);
    if (res.ok) {
      const data = await res.json();
      for (const m of data.members) {
        if (m.id !== myId) {
          await fetch(`${baseURL}/room/${roomId}/kick`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id }) });
        }
      }
    }
  }
  location.href = "/static/kick.html";
}

// =====================
// ユーティリティ
// =====================
function toggleMembers() { const box = document.getElementById("members"); box.style.display = box.style.display === "none" ? "block" : "none"; }
function showPopup(text) { const popup = document.getElementById("popup"); popup.textContent = text; popup.style.display = "block"; setTimeout(() => popup.style.display = "none", 3000); }
function copyURL() { const input = document.getElementById("join-url"); navigator.clipboard.writeText(input.value); showPopup("参加URLをコピーしました"); }
function sendMessageToAll() { const text = prompt("全員に送るメッセージ"); if (!text) return; if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "host_message", text })); }
function sendMessageToId(id) { const member = lastMembers.find(m => m.id === id); if (!member) return; const text = prompt(`${member.name}さんに送るメッセージ`); if (!text) return; if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "host_message", text, targetId: id })); }

// =====================
// ゲーム選択
// =====================
function selectGame(type) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const gameDropdown = document.getElementById("gameDropdown");
  if (gameDropdown) gameDropdown.style.display = "none";
  const container = document.getElementById("game-container");

  if (myId !== hostId) return;

  if (type === "quiz") {
    currentGame = "quiz";
    socket.send(JSON.stringify({ type: "start_quiz" }));
    container.classList.add("active");
    startQuizHost(socket, container);
    document.getElementById("exitQuizBtn").style.display = "inline-block";
  }

  if (type === "nasa") {
    if (!container) { console.error("❌ game-container が見つかりません"); return; }
    if (typeof startNASAHost !== "function") { console.error("❌ startNASAHost が関数ではありません"); return; }
    currentGame = "nasa"; 
    const items = ["パラシュート", "箱に入ったマッチ", "宇宙食", "45口径ピストル2丁", "粉ミルク1ケース", "酸素ボンベ2本", "15mのナイロン製ロープ", "ソーラー発電式の携帯用ヒーター", "月面用の星図表", "自動的に膨らむ救命ボート", "方位磁石", "水19L", "注射器の入った救急箱", "太陽電池のFM送受信器", "照明弾"];
    const correct = [8,15,4,11,12,1,6,13,3,9,14,2,7,5,10];
    console.log("🚀 start_nasa送信", items, correct);
    socket.send(JSON.stringify({ type: "start_nasa", items, correct }));
    container.classList.add("active");
    startNASAHost(socket, container);
    document.getElementById("exitQuizBtn").style.display = "inline-block";
  }
}

// =====================
// WebSocket接続
// =====================
function connectSocket() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${location.host}/ws/${roomId}`);

  socket.onopen = () => { console.log("WebSocket connected"); window.socket = socket; };
  socket.onmessage = (e) => {
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }

    if (msg.type === "host_message") { if (msg.targetId && msg.targetId !== myId) return; showPopup("📩 親： " + msg.text); }
    if (msg.type === "start_quiz") { const container = document.getElementById("game-container"); container.classList.add("active"); document.getElementById("exitQuizBtn").style.display = "inline-block"; if (myId !== hostId) startQuizPlayer(socket, container); }
    if (msg.type === "start_nasa") { const container = document.getElementById("game-container"); container.classList.add("active"); document.getElementById("exitQuizBtn").style.display = "inline-block"; if (myId !== hostId) startNASAPlayer(socket, container); }
    if (msg.type === "end_quiz" || msg.type === "end_nasa") { const container = document.getElementById("game-container"); container.classList.remove("active"); container.innerHTML = ""; document.getElementById("exitQuizBtn").style.display = "none"; if (window.removeProgressUI) window.removeProgressUI(); currentGame = null; }
  };

  socket.onerror = (e) => console.error("WebSocket error", e);
  socket.onclose = () => { setTimeout(connectSocket, 2000); };
}

// =====================
// 初期化
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const gameBtn = document.getElementById("gameSelectBtn");
  const gameDropdown = document.getElementById("gameDropdown");
  const exitQuizBtn = document.getElementById("exitQuizBtn");
  const nasaBtn = document.getElementById("nasaBtn");
  const quizBtn = document.getElementById("quizBtn");

  if (nasaBtn) nasaBtn.disabled = true;

  if (gameBtn) gameBtn.onclick = (e) => { 
    e.stopPropagation(); 
    gameDropdown.style.display = gameDropdown.style.display === "block" ? "none" : "block"; 
  };
  if (exitQuizBtn) exitQuizBtn.onclick = () => {
    if (currentGame && socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: `end_${currentGame}` }));
    const container = document.getElementById("game-container"); 
    container.classList.remove("active"); 
    container.innerHTML = "";
    exitQuizBtn.style.display = "none"; 
    if (window.removeProgressUI) window.removeProgressUI(); 
    currentGame = null;
  };

  connectSocket();

  loadRoom().then(() => { 
    updateMembers(); 
    setInterval(updateMembers, 2000); 
    if (nasaBtn) { nasaBtn.disabled = false; console.log("✅ NASAボタン有効化"); }
  });

  document.addEventListener("click", (e) => {
    if (nasaBtn && nasaBtn.contains(e.target)) { e.stopPropagation(); if (!nasaBtn.disabled) selectGame("nasa"); return; }
    if (quizBtn && quizBtn.contains(e.target)) { e.stopPropagation(); selectGame("quiz"); return; }
    if (gameDropdown && !gameDropdown.contains(e.target) && !e.target.closest("#gameSelectBtn")) gameDropdown.style.display = "none";
  });
});

// =====================
// グローバル登録
// =====================
window.copyURL = copyURL;
window.selectGame = selectGame;
window.toggleMembers = toggleMembers;
window.exitRoom = exitRoom;
window.kickMember = kickMember;

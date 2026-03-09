// 修正版 room.js（安全版 / 他ロジック変更なし）

import { startQuizHost } from "/static/js/quiz/quiz-host.js";
import { startQuizPlayer } from "/static/js/quiz/quiz-player.js";

const params = new URLSearchParams(location.search);
const roomId = params.get("room");
let myName = params.get("name") || "";
let hostName = "";
let lastMembers = [];
let joined = false;
let missingCount = 0; // ← 修正① 外に出す

const baseURL = location.origin;

async function loadRoom() {
const res = await fetch(`${baseURL}/room/${roomId}?name=${encodeURIComponent(myName)}`);
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
const joinURL = window.location.origin + "/static/join.html?room=" + roomId;
document.getElementById("join-url").value = joinURL;

```
if (typeof QRCode !== "undefined") {
  new QRCode(document.getElementById("qrcode"), joinURL);
}
```

}

if (myName !== hostName && !joined) {
joined = true;
try {
await fetch(`${baseURL}/room/${roomId}/join`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name: myName })
});
} catch (e) {
console.error("参加処理でエラー", e);
}
}
}

async function updateMembers() {
try {
const res = await fetch(`${baseURL}/room/${roomId}/members`);
if (!res.ok) return;

```
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
    list.push(`・${m} <button onclick="kickMember('${m}')">退室させる</button>`);
  });
} else {
  list.push(`・${myName} (自分)`);
  data.members.forEach(m => {
    if (m === hostName || m === myName) return;
    list.push(`・${m}`);
  });
}

document.getElementById("members").innerHTML = list.join("<br>");
```

} catch (e) {
console.error("メンバー更新エラー", e);
}
}

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

/* ===== 遊び選択 ===== */

function selectGame(type) {

if (!socket || socket.readyState !== WebSocket.OPEN) {
console.warn("WebSocketまだ接続されてない");
return;
}

const gameDropdown = document.getElementById("gameDropdown");
if (gameDropdown) gameDropdown.style.display = "none";

const container = document.getElementById("game-container");

if (type === "quiz") {

```
if (myName === hostName) {
  startQuizHost(socket, container);
} else {
  startQuizPlayer(socket, container);
}
```

}
}

let socket;

function connectSocket() {

const protocol = location.protocol === "https:" ? "wss" : "ws";
socket = new WebSocket(`${protocol}://${location.host}/ws/${roomId}`);

socket.onopen = () => {
console.log("WebSocket connected");
};

socket.onerror = (e) => {
console.error("WebSocket error", e);
};

socket.onclose = () => { // ← 修正③ 再接続
console.log("WebSocket closed, reconnecting...");
setTimeout(connectSocket, 2000);
};

}

document.addEventListener("click", (e) => {

const gameBtn = document.getElementById("gameSelectBtn");
const gameDropdown = document.getElementById("gameDropdown");

if (
gameDropdown &&
!gameDropdown.contains(e.target) &&
e.target !== gameBtn
) {
gameDropdown.style.display = "none";
}

});

/* 🔥 初期起動 */

window.addEventListener("DOMContentLoaded", () => {

const gameBtn = document.getElementById("gameSelectBtn");
const gameDropdown = document.getElementById("gameDropdown");

const quizBtn = document.getElementById("quizBtn");

if (quizBtn) {
  quizBtn.onclick = () => selectGame("quiz");
}

if (gameBtn) {
gameBtn.onclick = (e) => {
e.stopPropagation();
gameDropdown.style.display =
gameDropdown.style.display === "none" ? "block" : "none";
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

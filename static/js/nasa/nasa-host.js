import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect = null;
let lastItems = null;
let lastRanking = null;

let teamCount = 2;

export function startNASAHost(ws, uiContainer) {

  socket = ws;
  container = uiContainer;

  showTeamSetup(() => {

    createItemEditor(container, (items, correct) => {

      lastItems = items;
      lastCorrect = correct;

      socket.send(JSON.stringify({
        type: "nasa_start",
        items: items,
        correct: correct
      }));

      showControl();

    });

  });

  socket.addEventListener("message", (e) => {

    let data;
    try { data = JSON.parse(e.data); } catch { return; }

    if (data.type === "nasa_ranking") {
      lastRanking = data;
      showRanking(container, data, true);
      addBackToCorrectButton();
    }

    if (data.type === "nasa_result") {
      showCorrect(container, lastItems, data.correct, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });
    }

  });

  window.showCorrectAgain = () => {
    if (lastCorrect) {
      showCorrect(container, lastItems, lastCorrect, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });
    }
  };

}

// =========================
// チーム設定
// =========================
function showTeamSetup(onNext){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>チーム設定</h2>
      <input id="teamCount" type="number" value="2" min="2" max="10">
      <button id="nextBtn">次へ</button>
    </div>
  `;

  document.getElementById("nextBtn").onclick=()=>{
    teamCount = parseInt(document.getElementById("teamCount").value) || 2;

    socket.send(JSON.stringify({
      type:"set_team_count",
      count: teamCount
    }));

    onNext();
  };

}

// =========================
// コントロール
// =========================
function showControl(){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>NASAゲーム進行</h2>

      <button id="startTeam">チーム回答開始</button>
      <button id="startLeader">リーダー選択開始</button>
      <button id="showResult">正解発表</button>
      <button id="showRanking">ランキング</button>
    </div>
  `;

  document.getElementById("startTeam").onclick=()=>{
    socket.send(JSON.stringify({
      type:"start_team_phase"
    }));
  };

  // ★追加
  document.getElementById("startLeader").onclick=()=>{
    socket.send(JSON.stringify({
      type:"start_leader_phase"
    }));
  };

  document.getElementById("showResult").onclick=()=>{
    socket.send(JSON.stringify({type:"nasa_show_result"}));
  };

  document.getElementById("showRanking").onclick=()=>{
    socket.send(JSON.stringify({
      type:"nasa_get_ranking",
      name: window.myName || "host"
    }));
  };

}

// =========================
// 戻るボタン
// =========================
function addBackToCorrectButton() {

  const btn = document.createElement("button");
  btn.textContent = "正解を見る";

  btn.onclick = () => {
    if (window.showCorrectAgain) {
      window.showCorrectAgain();
    }
  };

  container.appendChild(btn);
}

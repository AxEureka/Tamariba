import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect = null;
let lastItems = null;
let lastRanking = null;

// ★ 追加
let teamCount = 2;

export function startNASAHost(ws, uiContainer) {

  socket = ws;
  container = uiContainer;

  // =========================
  // ★ 先にチーム数選択UI
  // =========================
  showTeamSetup(() => {

    // 元の処理（完全維持）
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

  // 正解再表示（そのまま）
  window.showCorrectAgain = () => {
    if (lastCorrect) {
      showCorrect(container, lastItems, lastCorrect, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });
    }
  };

}

// =========================
// ★ チーム設定UI（追加）
// =========================
function showTeamSetup(onNext){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>チーム設定</h2>
      <label>チーム数：</label>
      <input id="teamCount" type="number" min="2" max="10" value="2">
      <br><br>
      <button id="nextBtn">次へ</button>
    </div>
  `;

  const input = document.getElementById("teamCount");
  const btn = document.getElementById("nextBtn");

  btn.onclick=()=>{

    teamCount = parseInt(input.value) || 2;

    socket.send(JSON.stringify({
      type:"set_team_count",
      count: teamCount
    }));

    onNext();
  };

}

// =========================
// コントロール画面（既存＋追加）
// =========================
function showControl(){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>NASAゲーム進行</h2>

      <!-- ★ 追加 -->
      <button id="startTeam">チーム回答開始</button>

      <button id="showResult">正解発表</button>
      <button id="showRanking">ランキング</button>
    </div>
  `;

  const resultBtn = document.getElementById("showResult");
  const rankingBtn = document.getElementById("showRanking");

  // ★ 追加
  const teamBtn = document.getElementById("startTeam");

  if (teamBtn) {
    teamBtn.onclick=()=>{
      socket.send(JSON.stringify({
        type:"start_team_phase"
      }));
    };
  }

  // ↓↓↓ここ完全に元のまま↓↓↓

  if (resultBtn) {
    resultBtn.onclick=()=>{
      socket.send(JSON.stringify({type:"nasa_show_result"}));
    };
  }

  if (rankingBtn) {
    rankingBtn.onclick=()=>{
     socket.send(JSON.stringify({
      type:"nasa_get_ranking",
      name: window.myName || "host"
    }));
    };
  }

}

// =========================
// ランキング→正解ボタン（そのまま）
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

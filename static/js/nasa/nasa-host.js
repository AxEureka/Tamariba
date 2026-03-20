import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect = null;
let lastItems = null;
let lastRanking = null;

export function startNASAHost(ws, uiContainer) {

  socket = ws;
  container = uiContainer;

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

  // 正解再表示
  window.showCorrectAgain = () => {
    if (lastCorrect) {
      showCorrect(container, lastItems, lastCorrect, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });
    }
  };

}

// =========================
// コントロール画面
// =========================
function showControl(){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>NASAゲーム進行</h2>
      <button id="showResult">正解発表</button>
      <button id="showRanking">ランキング</button>
    </div>
  `;

  const resultBtn = document.getElementById("showResult");
  const rankingBtn = document.getElementById("showRanking");

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
// ランキング→正解ボタン
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

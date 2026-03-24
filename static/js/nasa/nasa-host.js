import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect = null;
let lastItems = null;
let lastRanking = null;

let teamCount = 2;

// ★進捗表示用
let progressDiv = null;

export function startNASAHost(ws, uiContainer) {

  socket = ws;
  container = uiContainer;

  showTeamSetup(() => {

    createItemEditor(container, (items, correct) => {

      console.log("🔥 onSubmit呼ばれた", items, correct);

      lastItems = items;
      lastCorrect = correct;

      console.log("🚀 start_nasa送信", items, correct);

      socket.send(JSON.stringify({
        type: "start_nasa",
        items: items,
        correct: correct
      }));

      showControl();

      // ★追加：進捗UI
      createProgressUI();

    });

  });

  socket.addEventListener("message", (e) => {

    let data;
    try { data = JSON.parse(e.data); } catch { return; }

    console.log("📩 ホスト受信:", data);

    // ★個人進捗
    if (data.type === "nasa_personal_progress") {
      updateProgress(`個人回答：${data.done} / ${data.total}人`);
    }

    if (data.type === "team_update") {

      if(data.selected != null && data.total != null){
    
        const remaining = data.total - data.selected;
    
        updateProgress(`チーム選択中：残り ${remaining} 人`);
    
        if(remaining === 0){
          updateProgress("全員チーム選択完了！");
        }
      }
    }

    // ★チーム進捗
    if (data.type === "nasa_team_progress") {
      updateProgress(`チーム回答：${data.done} / ${data.total}チーム`);
    }

    if (data.type === "nasa_ranking") {
      lastRanking = data;
      showRanking(container, data, true);

      // ❌ showControl(); ←削除（上書き防止）

      addBackToCorrectButton();
    }

    if (data.type === "nasa_result") {
      showCorrect(container, lastItems, data.correct, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });

      // ❌ showControl(); ←削除（上書き防止）
    }

    if (data.type === "end_nasa") {
      removeProgressUI();
    }

  });

  window.showCorrectAgain = () => {
    if (lastCorrect) {
      showCorrect(container, lastItems, lastCorrect, () => {
        socket.send(JSON.stringify({ type: "nasa_get_ranking" }));
      });

      // ❌ showControl(); ←削除（上書き防止）
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

      <br><br>

      <button id="editNames">チーム名を設定</button>

      <div id="teamNameArea" style="margin-top:10px;"></div>

      <br>
      <button id="nextBtn">次へ</button>
    </div>
  `;

  const nameArea = document.getElementById("teamNameArea");

  // ★チーム名入力生成
  document.getElementById("editNames").onclick = () => {

    const count = parseInt(document.getElementById("teamCount").value) || 2;

    nameArea.innerHTML = "";

    for(let i=0;i<count;i++){
      nameArea.innerHTML += `
        <div>
          チーム${i+1}名：
          <input class="teamNameInput" placeholder="未入力ならデフォルト">
        </div>
      `;
    }
  };

  document.getElementById("nextBtn").onclick=()=>{

    console.log("👉 チーム設定 次へ押された");

    teamCount = parseInt(document.getElementById("teamCount").value) || 2;

    // ★チーム名取得
    const inputs = document.querySelectorAll(".teamNameInput");
    let teamNames = [];

    if(inputs.length > 0){
      inputs.forEach((input, i)=>{
        const name = input.value.trim();
        teamNames.push(name || `チーム${i+1}`);
      });
    }else{
      // 入力してない場合
      for(let i=0;i<teamCount;i++){
        teamNames.push(`チーム${i+1}`);
      }
    }

    // ★ここ変更（名前も送る）
    socket.send(JSON.stringify({
      type:"set_team_count",
      count: teamCount,
      names: teamNames
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

  showPhaseOverlay("チーム選択中：残り 計算中...");

  socket.send(JSON.stringify({ type:"start_team_phase" }));
};

document.getElementById("startLeader").onclick=()=>{

  showPhaseOverlay("リーダー選択中...");

  socket.send(JSON.stringify({ type:"start_leader_phase" }));
};

  document.getElementById("showResult").onclick=()=>{
    socket.send(JSON.stringify({type:"nasa_show_result"}));
  };

  document.getElementById("showRanking").onclick=()=>{
    socket.send(JSON.stringify({
      type:"nasa_get_ranking",
      name: null
    }));
  };
}

// =========================
// ★進捗UI
// =========================
function createProgressUI(){

  if(progressDiv) return;

  progressDiv = document.createElement("div");

  progressDiv.style.position = "fixed";
  progressDiv.style.top = "10px";
  progressDiv.style.right = "10px";
  progressDiv.style.background = "rgba(0,0,0,0.7)";
  progressDiv.style.color = "white";
  progressDiv.style.padding = "8px 12px";
  progressDiv.style.borderRadius = "8px";
  progressDiv.style.zIndex = "9999";
  progressDiv.style.fontWeight = "bold";

  progressDiv.textContent = "待機中...";

  document.body.appendChild(progressDiv);
}

function updateProgress(text){
  if(progressDiv){
    progressDiv.textContent = text;
  }
}

// =========================
// ★フェーズポップ（追加）
// =========================
function showPhaseOverlay(text){

  if(!progressDiv){
    progressDiv = document.createElement("div");

    progressDiv.style.position = "fixed";
    progressDiv.style.top = "50%";
    progressDiv.style.left = "50%";
    progressDiv.style.transform = "translate(-50%, -50%)";
    progressDiv.style.background = "rgba(0,0,0,0.85)";
    progressDiv.style.color = "white";
    progressDiv.style.padding = "20px 30px";
    progressDiv.style.borderRadius = "12px";
    progressDiv.style.fontSize = "20px";
    progressDiv.style.zIndex = "9999";
    progressDiv.style.fontWeight = "bold";
    progressDiv.style.textAlign = "center";

    document.body.appendChild(progressDiv);
  }

  progressDiv.style.display = "block";
  progressDiv.textContent = text;
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

 const ui = container.querySelector(".nasa-ui");
if (ui) {
  ui.appendChild(btn);
}
}

function removeProgressUI(){
  if(progressDiv){
    progressDiv.remove();
    progressDiv = null;
  }
}

window.removeProgressUI = removeProgressUI;

// 修正版 room.js（ボタン位置調整済 / 再接続対応・巻き添え防止）
console.log("ROOM JS VERSION: RESULT-BUTTON-DIRECT-2026");

import { startQuizHost } from "/static/js/quiz/quiz-host.js";
import { startQuizPlayer } from "/static/js/quiz/quiz-player.js";
import { startNASAHost } from "/static/js/nasa/nasa-host.js";
import { startNASAPlayer } from "/static/js/nasa/nasa-player.js";
import { startCompatibilityHost } from "/static/js/compatibility/compatibility-host.js";
import {
    startCompatibilityPlayer,
    showCompatibilityTeam,
    showRankingQuestion,
    showRankingPrediction
} from "/static/js/compatibility/compatibility-player.js";
import {
    showCompatibilityFinalResult
} from "/static/js/compatibility/compatibility-results.js";
const params = new URLSearchParams(location.search);
const roomId = params.get("room");
let myName = params.get("name") || "";
window.myName = myName;
let hostName = "";
let lastMembers = [];
let joined = false;
let missingCount = 0;
let compatibilityHostUI = null;

const baseURL = location.origin;

// =====================
// 参加処理
// =====================
async function loadRoom() {
  const res = await fetch(`${baseURL}/room/${roomId}?name=${encodeURIComponent(myName)}`);
  if (!res.ok) return;

  const data = await res.json();
  hostName = data.host;
  if (!myName) myName = hostName;

  // ★同名チェック（members API使う）
  try {
    const res2 = await fetch(`${baseURL}/room/${roomId}/members`);
    if (res2.ok) {
      const memberData = await res2.json();
  
      if (memberData.members.includes(myName) && myName !== hostName) {
        alert("同じニックネームの人が既にいます。別の名前にしてください。");
        location.href = `/static/join.html?room=${roomId}`;
        return;
      }
    }
  } catch (e) {
    console.error("メンバー取得失敗", e);
  }
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

    const qrBtn = document.getElementById("showQRBtn");
    if (qrBtn) qrBtn.style.display = "inline-block";

  }

  const joinURL = window.location.origin + "/static/join.html?room=" + roomId;
  document.getElementById("join-url").value = joinURL;

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
        list.push(`
          ・${m}
          <button class="msgBtn" data-target="${m}">💬</button>
          <button class="kickBtn" data-target="${m}">退室</button>
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

    document.querySelectorAll("#members .msgBtn").forEach(btn => {
      btn.onclick = () => sendMessageTo(btn.dataset.target);
    });
    
    document.querySelectorAll("#members .kickBtn").forEach(btn => {
      btn.onclick = () => kickMember(btn.dataset.target);
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

function openQR() {
  const modal = document.getElementById("qrModal");
  const box = document.getElementById("qrModalCode");

  modal.style.display = "flex";
  box.innerHTML = "";

  const url = `${location.origin}/static/join.html?room=${roomId}`;

  console.log("QR URL:", url);

  new QRCode(box, {
  text: url,
  width: 360,
  height: 360,
  correctLevel: QRCode.CorrectLevel.L
});
}

function closeQR() {
  document.getElementById("qrModal").style.display = "none";
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

      container.classList.add("active");
      container.classList.add("nasa-active");

      startNASAHost(socket, container);
  }
}

 if (type === "compatibility") {
  console.log("selectGame compatibility");
  if (myName === hostName) {
      currentGame = "compatibility";
      container.classList.add("active");
      compatibilityHostUI =
          startCompatibilityHost(
              ()=>socket,
              container
          );
      document.getElementById("exitQuizBtn").style.display = "inline-block";
      }
    }
}

let socket;
let currentGame = null;
let rankingMode = "";
let rankingAnswerers = {};
let rankingPredictionCount = 0;
let rankingTotalPredictors = 0;
let rankingQuestionCount = 0;

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
    console.log(
        "受信:",
        msg.type,
        msg
    );

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
      if (myName !== hostName) {
          startNASAPlayer(
              socket,
              container,
              msg.items
          );
    
      }
    }

   if (msg.type === "start_compatibility") {

      const container =
          document.getElementById("game-container");
  
      container.classList.add("active");
  
      console.log(
          "相性診断開始受信",
          msg.questions
      );

      if(
          myName === hostName &&
          compatibilityHostUI
      ){
          compatibilityHostUI.showTeamCreate();
      }
  
  
      if (myName !== hostName) {
  
          startCompatibilityPlayer(
              container,
              msg.questions,
              socket
          );
  
      }
  
  }
  


if (msg.type === "compatibility_team_created") {

    const container =
        document.getElementById("game-container");


    if(myName === hostName && compatibilityHostUI){

        compatibilityHostUI.showTeams(
            msg.teams
        );

    }else{

        showCompatibilityTeam(
            container,
            msg.teams
        );

    }

}
    
if (msg.type === "ranking_question") {

    const container =
        document.getElementById("game-container");

    console.log(
        "ランキング問題受信",
        JSON.stringify(msg, null, 2)
    );

    rankingMode = "answering";
    rankingAnswerers = msg.answerers;

    // ★ランキングの全問題数を保存
    if (msg.total_questions !== undefined) {
        rankingQuestionCount = msg.total_questions;
    }


    // =================================
    // 親はランキング回答画面を表示しない
    // =================================

    if (myName === hostName) {

        console.log(
            "親画面：回答者の回答を待機"
        );
    
        // 回答完了を待たずに予測開始ボタンを表示
        if (
            compatibilityHostUI &&
            compatibilityHostUI.showPredictionButton
        ) {
    
            compatibilityHostUI.showPredictionButton();
    
        }
    
        return;
    }


    // =================================
    // 子だけランキング回答画面を表示
    // =================================

    showRankingQuestion(
        container,
        msg,
        socket
    );
}
        
if(msg.type === "ranking_phase" &&
   msg.phase === "prediction"){

    const container =
        document.getElementById("game-container");


    // 出題者か確認
    let isAnswerer = false;

    Object.values(
        msg.answerers
    ).forEach(name => {

        if(name === myName){
            isAnswerer = true;
        }

    });


   // 親（監督）
    if(myName === hostName){

        console.log("親画面：予想受付中");
    
        if(
            compatibilityHostUI &&
            compatibilityHostUI.setProgress
        ){
    
            compatibilityHostUI.setProgress(
                "予想を受け付けています"
            );
    
        }
    
        // 全員の予想完了を待たずに
        // 結果発表ボタンを表示
        if(
            compatibilityHostUI &&
            compatibilityHostUI.showResultButton
        ){
    
            compatibilityHostUI.showResultButton();
    
        }
    
    }

    // =========================
    // 出題者
    // =========================

    else if(isAnswerer){

        container.innerHTML = `
            <h2>予測中です</h2>
            <p>他の参加者の予想を待っています</p>
        `;

    }


    // =========================
    // 予想者
    // =========================

    else{

        showRankingPrediction(
            container,
            msg,
            socket
        );

    }

}      
if(msg.type==="ranking_prediction_progress"){

    console.log(
        "予想進捗:",
        msg.done,
        "/",
        msg.total
    );

    if(
        myName === hostName &&
        compatibilityHostUI &&
        compatibilityHostUI.setProgress
    ){

        compatibilityHostUI.setProgress(
            `予想状況：${msg.done}/${msg.total}人 回答済み`
        );

    }

}
      
if(msg.type==="ranking_result"){

    const container =
        document.getElementById("game-container");


    // =====================================
    // 現在の問題番号
    // =====================================

    const index = msg.question_index;


    // =====================================
    // 親画面
    // =====================================

    if(myName === hostName){

        console.log(
            "親画面：結果受信",
            index + 1,
            "問目"
        );
    
        // =================================
        // 結果表示
        // =================================
    
        let teamScoreText = "";
    
        if(msg.team_scores){
    
            for(
                const [team, score]
                of Object.entries(msg.team_scores)
            ){
    
                teamScoreText +=
                    `${team}：${score}点　`;
            }
    
        }
    
        if(
            compatibilityHostUI &&
            compatibilityHostUI.setProgress
        ){
    
            compatibilityHostUI.setProgress(
                `第${index + 1}問 結果　｜　${teamScoreText}`
            );
    
        }
    
    
        // =================================
        // 最終問題かどうか
        // =================================

        console.log(
            "判定確認",
            "index=", index,
            "rankingQuestionCount=", rankingQuestionCount
        );
        
        if(msg.is_final){

            if(
                compatibilityHostUI &&
                compatibilityHostUI.showFinalResultButton
            ){
        
                compatibilityHostUI.showFinalResultButton();
        
            }
        
        }
        else{
        
            if(
                compatibilityHostUI &&
                compatibilityHostUI.showNextButton
            ){
        
                compatibilityHostUI.showNextButton();
        
            }
        
        }
    
    }


            // =====================================
            // 子画面
            // =====================================
        
            else{
        
                // -----------------------------
                // 自分のチームを探す
                // -----------------------------
        
                let myTeam = null;
        
                if(msg.teams){
        
                    for(
                        const [teamName, teamInfo]
                        of Object.entries(msg.teams)
                    ){
        
                        if(
                            teamInfo.members &&
                            teamInfo.members.includes(myName)
                        ){
        
                            myTeam = teamName;
                            break;
        
                        }
        
                    }
        
                }
        
        
                // -----------------------------
                // 自チームの回答者
                // -----------------------------
        
                let answerer = null;
        
                if(
                    msg.question_answerers &&
                    msg.question_answerers[index]
                ){
        
                    answerer =
                        msg.question_answerers[index][myTeam];
        
                }
        
        
                // -----------------------------
                // 回答者の答え
                // -----------------------------
        
                let answer = null;
        
                if(
                    answerer &&
                    msg.true_answers &&
                    msg.true_answers[index]
                ){
        
                    answer =
                        msg.true_answers[index][answerer];
        
                }
        
        
                // -----------------------------
                // 自分の予想
                // -----------------------------
        
                let myPrediction = null;
        
                if(
                    msg.predictions &&
                    msg.predictions[myName] &&
                    msg.predictions[myName][index]
                ){
        
                    const predictionData =
                        msg.predictions[myName][index];
        
                    if(answerer){
        
                        myPrediction =
                            predictionData[answerer];
        
                    }
        
                }
        
        
                // -----------------------------
                // 自分の今回の得点
                // -----------------------------
        
                let myQuestionScore = 0;
        
                if(
                    msg.question_scores &&
                    msg.question_scores[index]
                ){
        
                    myQuestionScore =
                        msg.question_scores[index][myName] ?? 0;
        
                }
        
        
                // -----------------------------
                // 今回の結果詳細
                // -----------------------------
        
                let myResult = null;
        
                if(
                    msg.question_results &&
                    msg.question_results[myName]
                ){
        
                    const results =
                        msg.question_results[myName];
        
                    myResult =
                        results.find(
                            r => r.target === answerer
                        );
        
                }
        
        
                // -----------------------------
                // 結果タイプ
                // -----------------------------
        
                let resultType =
                    myResult?.type ?? "―";
        
                let resultScore =
                    myResult?.score ?? myQuestionScore;
                
                // -----------------------------
                // ランキング表示用の選択肢変換
                // -----------------------------
                
                const question =
                    msg.questions?.[index];
                
                const choices =
                    question?.choices || [];
                
                function getChoiceText(id){
                
                    const choice =
                        choices.find(
                            c => Number(c.id) === Number(id)
                        );
                
                    return choice
                        ? choice.text
                        : `選択肢${id}`;
                }
                
                
                // 回答者のランキング
                const answerRanking =
                    Array.isArray(answer)
                        ? answer
                        : [];
                
                // 自分の予想ランキング
                const predictionRanking =
                    Array.isArray(myPrediction)
                        ? myPrediction
                        : [];
                
                
                // -----------------------------
                // 通常の結果表示
                // -----------------------------

                container.innerHTML = `

                    <div class="ranking-result">
                
                        <h2>
                            第${index + 1}問 結果
                        </h2>
                
                
                        <div class="ranking-result-question">
                
                            <h3>
                                問題
                            </h3>
                
                            <p>
                                ${question?.question
                                    ?? question
                                    ?? ""}
                            </p>
                
                        </div>
                
                
                        <div class="ranking-result-answerer">
                
                            <p>
                                <strong>
                                    ${myTeam ?? "自チーム"}の回答者：
                                </strong>
                                ${answerer ?? "―"}
                            </p>
                
                        </div>
                
                
                        <!-- =========================
                             回答と予想
                        ========================== -->
                
                        <div class="ranking-comparison">
                
                            <!-- 回答者 -->
                
                            <div class="ranking-column">
                
                                <h3>
                                    回答者の回答
                                </h3>
                
                                ${
                                    answerRanking.length
                                    ?
                                    answerRanking.map(
                                        (id, i) => `
                                            <div class="ranking-row">
                                                <span class="ranking-position">
                                                    ${i + 1}位
                                                </span>
                
                                                <span class="ranking-choice">
                                                    ${getChoiceText(id)}
                                                </span>
                                            </div>
                                        `
                                    ).join("")
                                    :
                                    `<div class="ranking-empty">―</div>`
                                }
                
                            </div>
                
                
                            <!-- 自分の予想 -->
                
                            <div class="ranking-column">
                
                                <h3>
                                    あなたの予想
                                </h3>
                
                                ${
                                    predictionRanking.length
                                    ?
                                    predictionRanking.map(
                                        (id, i) => `
                                            <div class="ranking-row">
                                                <span class="ranking-position">
                                                    ${i + 1}位
                                                </span>
                
                                                <span class="ranking-choice">
                                                    ${getChoiceText(id)}
                                                </span>
                                            </div>
                                        `
                                    ).join("")
                                    :
                                    `<div class="ranking-empty">―</div>`
                                }
                
                            </div>
                
                        </div>
                
                
                        <!-- =========================
                             結果・得点
                        ========================== -->
                
                        <div class="ranking-result-summary">
                
                            <div class="ranking-result-type">
                                ${resultType}
                            </div>
                
                            <div class="ranking-result-score">
                                ${resultScore}点
                            </div>
                
                        </div>
                
                    </div>
                
                `;
        
            }
        
        }
    
    if(msg.type==="ranking_final_result"){

        const container =
            document.getElementById("game-container");
    
        console.log(
            "最終結果受信",
            msg
        );
    
        showCompatibilityFinalResult(
            container,
            msg,
            myName,
            hostName
        );
    
    }

    if (msg.type === "end_quiz" || msg.type === "end_nasa" || msg.type === "end_compatibility") {
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
  const compatibilityBtn =document.getElementById("compatibilityBtn");

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

  if (compatibilityBtn && compatibilityBtn.contains(e.target)){
    console.log("compatibility button clicked");
    e.stopPropagation();
    selectGame("compatibility");
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
window.openQR = openQR;
window.closeQR = closeQR;

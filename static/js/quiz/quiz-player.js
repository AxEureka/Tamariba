import {
  createQuestionUI,
  updateGraph,
  showCorrectAnswer,
  lockAnswers,
  updateScore
} from "./quiz-ui.js";

let socket;
let choices = [];
let answered = false;
let myChoice = null;

export function startQuizPlayer(ws, container){

  container.innerHTML = `
  <div id="my-score" style="
    position:sticky;
    top:0;
    background:#222;
    padding:10px;
    font-weight:bold;
    z-index:10;
  ">
    あなたの点数: 0点
  </div>

  <div id="send-status" style="
    text-align:center;
    margin-top:10px;
    color:#0f0;
    font-weight:bold;
    display:none;
  ">
    ✔ 送信しました
  </div>

  <div id="quiz-area"></div>
`;
  
  socket = ws;
  window.socket = ws;

  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}

    if(data.type === "quiz_question"){
      choices = data.choices;
      answered = false;
      myChoice = null;
    
      const area = document.getElementById("quiz-area");
      createQuestionUI(area, data.question, data.choices, sendAnswer);
    
      const buttons = area.querySelectorAll(".quiz-choice-btn");
      buttons.forEach(btn=>{
        btn.style.transition = "all 0.3s ease";
      });
    
      // ★これが安全版
      const status = container.querySelector("#send-status");
      if(status){
        status.style.display = "none";
      }
    }

    if(data.type === "quiz_votes"){
      // 無視（親のみ表示）
    }

    if(data.type === "quiz_show_graph"){
      updateGraph(data.votes, choices);
    }

    if(data.type === "quiz_correct"){
      const correct = data.correct;
    
      const buttons = document.querySelectorAll(".quiz-choice-btn");
    
      buttons.forEach((btn, i)=>{
    
        btn.style.transition = "all 0.3s ease";
    
        if(i === correct){
          btn.style.background = "#4CAF50";
          btn.style.color = "#fff";
          btn.style.fontWeight = "bold";
          btn.style.transform = "scale(1.05)";
        }
    
        if(i === myChoice && i !== correct){
          btn.style.background = "#f44336";
          btn.style.color = "#fff";
          btn.style.fontWeight = "bold";
        }
      });
    }
    if(data.type === "quiz_score_update"){
      console.log("score受信:", data.scores);
      updateScore(data.scores);
    
      const myName = window.myName;
      const myScore = data.scores[myName] || 0;
    
      const scoreBox = document.getElementById("my-score");
      if(scoreBox){
        scoreBox.textContent = `あなたの点数: ${myScore}点`;
      }
    }

    if(data.type === "quiz_timer_end"){
      lockAnswers();
    }

    if(data.type === "quiz_ranking"){
      const box = document.getElementById("quiz-area");
      const myName = window.myName;
    
      box.innerHTML = `
        <h3>ランキング</h3>
        ${data.ranking.map(r=>{
          const isMe = r[1] === myName;
    
          return `
            <div style="
              margin:6px 0;
              color:${isMe ? "yellow" : "white"};
              font-weight:${isMe ? "bold" : "normal"};
            ">
              ${r[0]}位 ${r[1]} : ${r[2]}点
            </div>
          `;
        }).join("")}
      `;
    }
  };
}

function sendAnswer(index){
  if(answered) return;
  answered = true;

  myChoice = index; // ★重要

  const buttons = document.querySelectorAll(".quiz-choice-btn");

  buttons.forEach((btn, i)=>{
    btn.disabled = true;

    if(i === index){
      btn.style.background = "#ffcc00";
      btn.style.color = "#000";
      btn.style.fontWeight = "bold";

      // 気持ちよさ（追加）
      btn.style.transform = "scale(1.08)";
      btn.style.transition = "all 0.15s ease";
      setTimeout(()=>{
        btn.style.transform = "scale(1)";
      }, 120);

    }else{
      btn.style.opacity = "0.5";
    }
  });

  // ✔ 送信完了UI（ここに移すのが安定）
  const status = document.getElementById("send-status");
  if(status) status.style.display = "block";

  socket.send(JSON.stringify({
    type:"quiz_answer",
    name: window.myName,
    choice:index
  }));

  lockAnswers();
}

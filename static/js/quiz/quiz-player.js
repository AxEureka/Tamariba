import {
  createQuestionUI,
  updateGraph,
  updateScore
} from "./quiz-ui.js";

let socket;
let myChoice = null;
let answered = false;

export function startQuizPlayer(ws, container){

  container.innerHTML = `
  <div id="my-score">あなたの点数: 0点</div>
  <div id="send-status">✔ 送信しました</div>
  <div id="quiz-area"></div>
  <div id="quiz-ranking"></div>
  `;

  socket = ws;
  window.socket = ws;

  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}

    // =========================
    // 問題表示
    // =========================
    if(data.type === "quiz_question"){
      answered = false;
      myChoice = null;

      window.currentChoices = data.choices; // ★これ追加
    
      const area = document.getElementById("quiz-area");
      area.innerHTML = "";   // ←ここ追加
    
      const status = document.getElementById("send-status");
      if(status) status.style.display = "none";
    
      createQuestionUI(
        area,
        data.question,
        data.choices,
        sendAnswer
      );
    }

    // =========================
    // グラフ
    // =========================
    if(data.type === "quiz_show_graph"){
      updateGraph(data.votes, window.currentChoices || []);
    }

    // =========================
    // 正解表示
    // =========================
    if(data.type === "quiz_correct"){
      const correct = data.correct;
      const buttons = document.querySelectorAll(".quiz-choice-btn");

      buttons.forEach((btn,i)=>{

        btn.classList.remove("selected","dim","correct","wrong");

        if(i === correct){
          btn.classList.add("correct");
        }

        if(i === myChoice && i !== correct){
          btn.classList.add("wrong");
        }
      });
    }

    // =========================
    // スコア更新
    // =========================
    if(data.type === "quiz_score_update"){
      updateScore(data.scores);

      const myScore = data.scores[window.myName] || 0;
      document.getElementById("my-score").textContent =
        `あなたの点数: ${myScore}点`;
    }

    // =========================
    // ランキング
    // =========================
    if(data.type === "quiz_ranking"){
     const box = document.getElementById("quiz-ranking");

      box.innerHTML = `
        <h3>ランキング</h3>
        ${data.ranking.map(r=>{
          const isMe = r[1] === window.myName;
          return `
            <div class="${isMe ? "my-rank" : ""}">
              ${r[0]}位 ${r[1]} : ${r[2]}点
            </div>
          `;
        }).join("")}
      `;
    }
  };
}

// =========================
// 回答送信
// =========================
function sendAnswer(index){
  if(answered) return;
  answered = true;

  myChoice = index;

  const buttons = document.querySelectorAll(".quiz-choice-btn");

  buttons.forEach((btn,i)=>{
    btn.disabled = true;

    btn.classList.add("disabled");

    if(i === index){
      btn.classList.add("selected");
    }else{
      btn.classList.add("dim");
    }
  });

  // ★ここに入れる
  const status = document.getElementById("send-status");
  if(status) status.style.display = "block";

  socket.send(JSON.stringify({
    type:"quiz_answer",
    name: window.myName,
    choice:index
  }));
}

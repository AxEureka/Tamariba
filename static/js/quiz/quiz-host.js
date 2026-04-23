import { updateGraph } from "./quiz-ui.js";

let socket;
let votes = [];
let correctAnswer = 0;

export function startQuizHost(ws, container){
  socket = ws;

  container.innerHTML = `
  <div class="quiz-ui">
    <h2>クイズ出題</h2>

    <input id="quiz-question" placeholder="問題文"><br><br>

    択数:
    <input id="choiceCount" type="number" min="2" max="8" value="4">
    <button id="generateChoices">生成</button>

    <br><br>
    <div id="choicesArea"></div>

    <br>
    正解:
    <select id="quiz-answer"></select>

    <br><br>
    タイマー:
    <select id="timerSeconds">
      <option value="5">5秒</option>
      <option value="10" selected>10秒</option>
      <option value="20">20秒</option>
    </select>

    <br><br>
    <button id="send-question">出題</button>
    <button id="show-graph">グラフ表示</button>
    <button id="reveal-answer">正解発表</button>

    <h3>投票結果</h3>
    <div id="vote-result"></div>
    
    <h3>グラフ</h3>
    <div id="quiz-graph"></div>

    <h3>配点</h3>
    <div id="score-area"></div>
    <button id="send-score">配点決定</button>
    <button id="show-ranking">ランキング</button>
  </div>
  `;

  document.getElementById("send-question").onclick = sendQuestion;
  document.getElementById("show-graph").onclick = ()=> {
    socket.send(JSON.stringify({type:"quiz_show_graph"}));
  };
  document.getElementById("reveal-answer").onclick = ()=> {
    socket.send(JSON.stringify({type:"quiz_correct", correct:correctAnswer}));
  };
  document.getElementById("send-score").onclick = sendScore;
  document.getElementById("show-ranking").onclick = ()=>{
    socket.send(JSON.stringify({type:"quiz_get_ranking"}));
  };

  document.getElementById("generateChoices").onclick = generateChoices;
  document.getElementById("choiceCount").onchange = generateChoices;

  generateChoices();

  socket.addEventListener("message", (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}
  
    if(data.type === "quiz_votes"){
      votes = data.votes;
      updateVotes();
      updateGraph(votes, getChoices());
    }
  
    // ★これ追加
    if(data.type === "quiz_ranking"){
      alert(
        data.ranking.map((r,i)=>`${i+1}位 ${r[0]}: ${r[1]}点`).join("\n")
      );
    }
  });
}

// 出題
function sendQuestion(){
  const q = document.getElementById("quiz-question").value.trim();
  const choicesArr = getChoices();
  const answer = parseInt(document.getElementById("quiz-answer").value);
  const seconds = parseInt(document.getElementById("timerSeconds").value);

  if(!q) return alert("問題文を入力");
  if(choicesArr.some(c=>!c)) return alert("選択肢入力");
  if(isNaN(answer)) return alert("正解選択");

  votes = new Array(choicesArr.length).fill(0);
  correctAnswer = answer;
  
  // ★ここ追加
  updateVotes();
  updateGraph(votes, choicesArr);

  createScoreInputs(choicesArr.length);

  socket.send(JSON.stringify({
    type:"quiz_question",
    question:q,
    choices:choicesArr,
    timer:seconds
  }));
}

// 択生成
function generateChoices(){
  let count = parseInt(document.getElementById("choiceCount").value);
  if(count<2) count=2;
  if(count>8) count=8;

  const area = document.getElementById("choicesArea");
  const select = document.getElementById("quiz-answer");

  area.innerHTML="";
  select.innerHTML="";

  for(let i=0;i<count;i++){
    area.innerHTML += `<input class="quiz-choice" placeholder="選択肢${i+1}"><br>`;
    select.innerHTML += `<option value="${i}">${i+1}</option>`;
  }
  createScoreInputs(count); // ★追加
}

// 投票表示
function updateVotes(){
  const box = document.getElementById("vote-result");
  box.innerHTML = votes.map((v,i)=>`${i+1}: ${v}票`).join("<br>");
}

// 選択肢取得
function getChoices(){
  return [...document.querySelectorAll(".quiz-choice")].map(i=>i.value.trim());
}

// 配点UI
function createScoreInputs(len){
  const area = document.getElementById("score-area");
  area.innerHTML="";
  for(let i=0;i<len;i++){
    area.innerHTML += `${i+1}: <input class="score-input" type="number" value="0"><br>`;
  }
}

// 配点送信
function sendScore(){
  const inputs = document.querySelectorAll(".score-input");
  const scoreMap = {};

  inputs.forEach((input,i)=>{
    scoreMap[i] = parseInt(input.value)||0;
  });

  socket.send(JSON.stringify({
    type:"quiz_score",
    scores:scoreMap
  }));
}

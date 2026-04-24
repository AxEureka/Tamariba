import { updateGraph } from "./quiz-ui.js";

let socket;
let correctAnswer = 0;
let currentChoices = [];
let votes = [];

export function startQuizHost(ws, container){
  socket = ws;

  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}
  
    if(data.type === "quiz_show_graph"){
      updateGraph(data.votes, currentChoices);
    }
  };
  
  container.innerHTML = `
  <div class="quiz-ui">
    <h2>クイズ出題</h2>

    <input id="quiz-question" placeholder="問題"><br><br>

    <input id="choiceCount" type="number" value="4" min="2" max="8">
    <button id="gen">生成</button>

    <div id="choices"></div>

    <select id="quiz-answer"></select>

    <button id="send">出題</button>
    <button id="correct">正解</button>
    <button id="graph">グラフ</button>
    <button id="ranking">ランキング</button>
  </div>
  `;

  document.getElementById("gen").onclick = generate;
  document.getElementById("send").onclick = sendQuestion;

  document.getElementById("correct").onclick = ()=>{
    socket.send(JSON.stringify({
      type:"quiz_correct",
      correct:correctAnswer
    }));
  };

  document.getElementById("graph").onclick = ()=>{
    socket.send(JSON.stringify({
      type:"quiz_show_graph",
      choices: currentChoices   // ★追加
    }));
  };

  document.getElementById("ranking").onclick = ()=>{
    socket.send(JSON.stringify({type:"quiz_get_ranking"}));
  };

  generate();
}

// =========================
function sendQuestion(){
  const q = document.getElementById("quiz-question").value.trim();
  currentChoices = getChoices();   // ★追加

  correctAnswer = parseInt(document.getElementById("quiz-answer").value);

  votes = new Array(currentChoices.length).fill(0);

  socket.send(JSON.stringify({
    type:"quiz_question",
    question:q,
    choices: currentChoices
  }));
}

// =========================
function generate(){
  const count = parseInt(document.getElementById("choiceCount").value);

  const area = document.getElementById("choices");
  const select = document.getElementById("quiz-answer");

  area.innerHTML = "";
  select.innerHTML = "";

  for(let i=0;i<count;i++){
    area.innerHTML += `<input class="c"><br>`;
    select.innerHTML += `<option value="${i}">${i+1}</option>`;
  }
}

// =========================
function getChoices(){
  return [...document.querySelectorAll(".c")].map(i=>i.value);
}

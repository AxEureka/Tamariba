let socket;
let votes = [];
let correctAnswer = 0;

export function startQuizHost(ws, container){
  socket = ws;

  container.innerHTML = `
  <div id="quiz-host-ui" class="quiz-ui">
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
    タイマー秒数:
    <select id="timerSeconds">
      <option value="5">5秒</option>
      <option value="10" selected>10秒</option>
      <option value="20">20秒</option>
      <option value="30">30秒</option>
    </select>
  
    <br><br>
    <button id="send-question">出題</button>
    <button id="show-graph">グラフ表示</button>
    <button id="reveal-answer">正解発表</button>
  
    <h3>投票結果</h3>
    <div id="vote-result"></div>
  </div>
  `;
  document.getElementById("send-question").onclick = sendQuestion;
  document.getElementById("show-graph").onclick = showGraph;
  document.getElementById("reveal-answer").onclick = revealAnswer;

  document.getElementById("generateChoices").onclick = generateChoices;
  document.getElementById("choiceCount").onchange = generateChoices;
  generateChoices(); // 初期表示


  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}

    if(data.type === "quiz_votes"){
      votes = data.votes;
      updateVotes();
    }
  };
}

// 出題
function sendQuestion(){
  const q = document.getElementById("quiz-question").value.trim();
  const choicesArr = [...document.querySelectorAll(".quiz-choice")].map(i => i.value.trim());
  const answer = parseInt(document.getElementById("quiz-answer").value);
  const seconds = parseInt(document.getElementById("timerSeconds").value);

   // 👇これが正解
  if(!q){
    alert("問題文を入力してください");
    return;
  }

  if(choicesArr.some(c => !c)){
    alert("選択肢をすべて入力してください");
    return;
  }

  if(isNaN(answer)){
    alert("正解を選択してください");
    return;
  }

  votes = new Array(choicesArr.length).fill(0);
  correctAnswer = answer;


  socket.send(JSON.stringify({
    type:"quiz_question",
    question:q,
    choices:choicesArr,
    timer: seconds
  }));
}

function generateChoices(){
  let count = parseInt(document.getElementById("choiceCount").value);

  if(isNaN(count) || count < 2) count = 2;
  if(count > 8) count = 8;  
  
  const area = document.getElementById("choicesArea");
  const select = document.getElementById("quiz-answer");

  area.innerHTML = "";
  select.innerHTML = "";

  for(let i=0;i<count;i++){
    const input = document.createElement("input");
    input.className = "quiz-choice";
    input.placeholder = `選択肢${i+1}`;
    area.appendChild(input);
    area.appendChild(document.createElement("br"));

    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i+1;
    select.appendChild(opt);
  }
}

// グラフ表示
function showGraph(){
  socket.send(JSON.stringify({type:"quiz_show_graph"}));
}

// 正解発表
function revealAnswer(){
  socket.send(JSON.stringify({type:"quiz_correct", correct:correctAnswer}));
}

// 投票表示
function updateVotes(){
  const box = document.getElementById("vote-result");
  if(!box) return;

  box.innerHTML = votes.map((v,i)=>`${i+1}: ${v}票`).join("<br>");
}

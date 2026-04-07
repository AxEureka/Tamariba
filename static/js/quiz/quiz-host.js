let socket;
let votes = [];
let correctAnswer = 0;

export function startQuizHost(ws, container){
  socket = ws;

  container.innerHTML = `
  <div id="quiz-host-ui">
    <h2>クイズ出題</h2>
    <input id="quiz-question" placeholder="問題文"><br><br>

    <input class="quiz-choice" placeholder="選択肢1"><br>
    <input class="quiz-choice" placeholder="選択肢2"><br>
    <input class="quiz-choice" placeholder="選択肢3"><br>
    <input class="quiz-choice" placeholder="選択肢4"><br><br>

    正解:
    <select id="quiz-answer">
      <option value="0">1</option>
      <option value="1">2</option>
      <option value="2">3</option>
      <option value="3">4</option>
    </select>

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
  const q = document.getElementById("quiz-question").value;
  const choicesArr = [...document.querySelectorAll(".quiz-choice")].map(i=>i.value);
  const answer = parseInt(document.getElementById("quiz-answer").value);
  const seconds = parseInt(document.getElementById("timerSeconds").value);

  votes = new Array(choicesArr.length).fill(0);
  correctAnswer = answer;

  socket.send(JSON.stringify({
    type:"quiz_question",
    question:q,
    choices:choicesArr,
    timer: seconds
  }));
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

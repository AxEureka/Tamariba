// quiz-host.js（タイマー残り秒数表示付き完全版）

let socket;
let votes = [0,0,0,0];
let correctAnswer = 0;
let timerInterval = null; // タイマー用

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

    <label><input type="checkbox" id="useTimer"> タイマー</label>
    <select id="timerSeconds">
      <option value="5">5秒</option>
      <option value="10" selected>10秒</option>
      <option value="20">20秒</option>
      <option value="30">30秒</option>
    </select>

    <div id="host-timer" style="margin-top:10px; font-weight:bold;"></div>

    <br>

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

  socket.addEventListener("message", e=>{

    let data;

    try{
      data = JSON.parse(e.data);
    }catch{
      return;
    }

    if(data.type === "quiz_votes"){
      updateVotesFromServer(data.votes);
    }

  });

}

/* =========================
   出題
========================= */
function sendQuestion(){

  const q = document.getElementById("quiz-question").value;

  const choices = [...document.querySelectorAll(".quiz-choice")]
    .map(i=>i.value);

  const answer = parseInt(
    document.getElementById("quiz-answer").value
  );

  // タイマー設定
  const useTimer = document.getElementById("useTimer").checked;
  const seconds = useTimer ? parseInt(document.getElementById("timerSeconds").value) : 0;

  votes = [0,0,0,0];
  correctAnswer = answer;

  // タイマーをリセットして開始（ホスト側表示用）
  clearInterval(timerInterval);
  const timerDisplay = document.getElementById("host-timer");

  if(seconds > 0){
    let time = seconds;
    timerDisplay.textContent = `残り ${time} 秒`;

    timerInterval = setInterval(()=>{
      time--;
      timerDisplay.textContent = `残り ${time} 秒`;

      if(time <= 0){
        clearInterval(timerInterval);
        timerDisplay.textContent = "回答締切";
        lockHostAnswers();
      }

    },1000);
  } else {
    timerDisplay.textContent = "";
  }

  // 出題情報送信
  socket.send(JSON.stringify({
    type:"quiz_question",
    question:q,
    choices:choices,
    timer: seconds
  }));

  updateVotes();

}

/* =========================
   回答ロック（ホスト側） 
========================= */
function lockHostAnswers(){
  document.querySelectorAll(".quiz-choice,input#quiz-question,select#quiz-answer,button#send-question")
  .forEach(el => el.disabled = true);
}

/* =========================
   グラフ表示
========================= */
function showGraph(){

  socket.send(JSON.stringify({
    type:"quiz_show_graph"
  }));

}

/* =========================
   正解発表
========================= */
function revealAnswer(){

  socket.send(JSON.stringify({
    type:"quiz_correct",
    correct:correctAnswer
  }));

  // タイマー終了表示
  clearInterval(timerInterval);
  const timerDisplay = document.getElementById("host-timer");
  timerDisplay.textContent = "";
}

/* =========================
   投票更新
========================= */
function updateVotesFromServer(serverVotes){

  votes = serverVotes;
  updateVotes();

}

function updateVotes(){

  const box = document.getElementById("vote-result");
  if(!box) return;

  box.innerHTML =
    "1: "+votes[0]+"票<br>"+
    "2: "+votes[1]+"票<br>"+
    "3: "+votes[2]+"票<br>"+
    "4: "+votes[3]+"票";

}

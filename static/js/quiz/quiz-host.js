// quiz-host.js

let socket;
let votes = [0,0,0,0];
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

<button id="send-question">出題</button>
<button id="reveal-answer">正解発表</button>

<h3>投票結果</h3>
<div id="vote-result"></div>

</div>
`;

document.getElementById("send-question").onclick = sendQuestion;
document.getElementById("reveal-answer").onclick = revealAnswer;

socket.addEventListener("message", e=>{

const data = JSON.parse(e.data);

if(data.type === "quiz_votes"){

updateVotesFromServer(data.votes);

}

});

}

function sendQuestion(){

const q = document.getElementById("quiz-question").value;

const choices = [...document.querySelectorAll(".quiz-choice")]
.map(i=>i.value);

const answer = parseInt(
document.getElementById("quiz-answer").value
);

votes = [0,0,0,0];
correctAnswer = answer;

socket.send(JSON.stringify({
type:"quiz_question",
question:q,
choices:choices
}));

updateVotes();

}

function revealAnswer(){

socket.send(JSON.stringify({
type:"quiz_correct",
correct:correctAnswer
}));

}

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

import {
createQuestionUI,
updateGraph,
showCorrectAnswer
} from "./quiz-ui.js";

let socket;
let container;
let choices = [];

let latestVotes = null;
let answered = false;
let graphVisible = false;

export function startQuizPlayer(ws, uiContainer){

console.log("quiz player start");

socket = ws;
container = uiContainer;

socket.addEventListener("message",(e)=>{

let data;

try{
data = JSON.parse(e.data);
}catch{
return;
}

/* 問題受信 */

if(data.type === "quiz_question"){

choices = data.choices;

latestVotes = null;
graphVisible = false;
answered = false;

createQuestionUI(
container,
data.question,
data.choices,
(index)=>sendAnswer(index)
);

}

/* 投票更新 */

if(data.type === "quiz_votes"){

latestVotes = data.votes;

if(graphVisible){
updateGraph(latestVotes, choices);
}

}

/* グラフ表示 */

if(data.type === "quiz_show_graph"){

graphVisible = true;

if(latestVotes){
updateGraph(latestVotes, choices);
}

}

/* 正解発表 */

if(data.type === "quiz_correct"){

showCorrectAnswer(data.correct);

}

});

}

function sendAnswer(index){

if(answered) return;
answered = true;

const params = new URLSearchParams(location.search);
const name = params.get("name") || "guest";

socket.send(JSON.stringify({
type:"quiz_answer",
name:name,
choice:index
}));

}

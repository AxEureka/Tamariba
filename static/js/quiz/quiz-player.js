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

if(data.type === "quiz_question"){

console.log("choices受信:", data.choices);
console.log("型:", typeof data.choices);

choices = data.choices;

// ★ここ追加
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

  if(data.type === "quiz_votes"){
  latestVotes = data.votes;

  if(graphVisible){
    updateGraph(latestVotes, choices);
  }
}

if(data.type === "quiz_show_graph"){

graphVisible = true;

if(latestVotes){
updateGraph(latestVotes, choices);
}

}
  
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

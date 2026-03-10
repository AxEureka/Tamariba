import {
createQuestionUI,
updateGraph,
showCorrectAnswer
} from "./quiz-ui.js";

let socket;
let container;
let choices = [];

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

choices = data.choices;

createQuestionUI(
container,
data.question,
data.choices,
(index)=>sendAnswer(index)
);

}

if(data.type === "quiz_votes"){

updateGraph(data.votes, choices);

}

if(data.type === "quiz_correct"){

showCorrectAnswer(data.correct);

}

});

}

function sendAnswer(index){

const params = new URLSearchParams(location.search);
const name = params.get("name") || "guest";

socket.send(JSON.stringify({
type:"quiz_answer",
name:name,
choice:index
}));

}

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
  
socket.addEventListener("message", e=>{

const data = JSON.parse(e.data);

if(data.type === "quiz_question"){

choices = data.choices;

createQuestionUI(
container,
data.question,
choices,
sendAnswer
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

btn.onclick = () => {

socket.send(JSON.stringify({
type:"quiz_answer",
name: myName,
choice: index
}));

};
}

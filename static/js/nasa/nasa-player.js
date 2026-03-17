import { createRankingUI, showCorrect, showScore } from "./nasa-ui.js";

let socket;
let container;

let items = [];
let correct = [];
let personal = [];
let team = [];

let teamName = "";

export function startNASAPlayer(ws, uiContainer) {

socket = ws;
container = uiContainer;

socket.addEventListener("message", (e) => {

let data;
try { data = JSON.parse(e.data); } catch { return; }

if (data.type === "nasa_start") {

items = data.items;
correct = data.correct;

startPersonal();

}

if (data.type === "nasa_result") {

showCorrect(container, items, data.correct);
showScore(container, calcScore(data.answers), calcScore(data.correct));

}

});

}


function startPersonal(){

createRankingUI(
container,
items,
(r)=>{

personal = r;

socket.send(JSON.stringify({
type:"nasa_personal",
ranks:r
}));

startTeam();

},
`${window.myName} の回答`
);

}


function startTeam(){

teamName = prompt("チーム名を入力してください","チームA") || "チーム";

createRankingUI(
container,
items,
(r)=>{

team = r;

socket.send(JSON.stringify({
type:"nasa_team",
ranks:r
}));

showResult();

},
`${teamName} の回答`
);

}


function calcScore(answer){

let score=0;

for(let i=0;i<answer.length;i++){

const c = correct && correct[i] !== undefined ? correct[i] : 0;

score += Math.abs(answer[i] - c);

}

return score;

}


function showResult(){

const p = calcScore(personal);
const t = calcScore(team);

showScore(container,p,t);

}

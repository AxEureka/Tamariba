import { createRankingUI, showCorrect, showRanking } from "./nasa-ui.js";

let socket;
let container;

let items=[];
let personal = [];
let team = [];
let teamName = "";
let lastCorrect=null;
let lastRanking=null;

export function startNASAPlayer(ws,uiContainer){

socket=ws;
container=uiContainer;

if(!window.myName){
const params=new URLSearchParams(location.search);
window.myName=params.get("name")||"名無し";
}

socket.addEventListener("message",(e)=>{

let data;
try{data=JSON.parse(e.data);}catch{return;}

if(data.type==="nasa_start"){
items=data.items;
startPersonal();
}

if(data.type==="nasa_result"){
lastCorrect=data.correct;

showCorrect(container,items,data.correct,()=>{
socket.send(JSON.stringify({
type:"nasa_get_ranking",
name:window.myName
}));
});
}

if(data.type==="nasa_ranking"){
lastRanking=data;
showRanking(container,data,false);

// ★ 追加：ランキング→正解に戻るボタン
addBackToCorrectButton();
}

});


// =========================
// ★ 正解再表示
// =========================
window.showCorrectAgain=()=>{
if(lastCorrect){
showCorrect(container,items,lastCorrect,()=>{
socket.send(JSON.stringify({
type:"nasa_get_ranking",
name:window.myName
}));
});
}
};

// =========================
// ★ ランキング再表示
// =========================
window.showRankingAgain=()=>{
if(lastRanking){
showRanking(container,lastRanking,false);
addBackToCorrectButton();
}
};

}

// =========================
// 個人回答
// =========================
function startPersonal(){

createRankingUI(container,items,(r)=>{

if(!confirm("個人回答を確定しますか？")) return;

personal=r;

socket.send(JSON.stringify({
type:"nasa_personal",
name:window.myName,
ranks:r
}));

startTeam();

},`${window.myName} の回答`,false);

}

// =========================
// チーム回答
// =========================
function startTeam(){

teamName = prompt("チーム名","チームA") || "チーム";

createRankingUI(container,items,(r)=>{

if(!confirm("チーム回答を確定しますか？")) return;

socket.send(JSON.stringify({
type:"nasa_team",
name:window.myName,
team:teamName,
ranks:r
}));

container.innerHTML=`
<h2>${teamName} の回答送信完了！</h2>
<p>結果発表をお待ちください…</p>
`;

},`${teamName} の回答`,true);

}


// =========================
// ★ 追加：ランキング→正解ボタン
// =========================
function addBackToCorrectButton(){

const btn=document.createElement("button");
btn.textContent="正解を見る";

btn.onclick=()=>{
window.showCorrectAgain();
};

container.appendChild(btn);

}

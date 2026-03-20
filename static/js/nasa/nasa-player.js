import { createRankingUI, showCorrect, showRanking } from "./nasa-ui.js";

let socket;
let container;

let items=[];
let lastCorrect=null;

let myTeam=null;
let teams={};
let leaders={};

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

// =========================
// 開始
// =========================
if(data.type==="nasa_start"){
items=data.items;
startPersonal();
}

// =========================
// ★ 追加：チーム数決定 → チーム選択開始
// =========================
if(data.type==="team_count_set"){
teams = {};
data.teams.forEach(t=>{
teams[t]=[];
});
startTeamSelect();
}

// =========================
// チームフェーズ開始（親トリガー）
// =========================
if(data.type==="team_phase_start"){
teams=data.teams;
leaders=data.leaders;
startTeamAnswer();
}

// =========================
// チーム更新
// =========================
if(data.type==="team_update"){
teams=data.teams;
renderTeamSelect();
}

// =========================
// リーダー確定
// =========================
if(data.type==="team_leader_set"){
leaders[data.team]=data.leader;
startTeamAnswer();
}

// =========================
// 結果
// =========================
if(data.type==="nasa_result"){
lastCorrect=data.correct;

showCorrect(container,items,data.correct,()=>{
socket.send(JSON.stringify({
type:"nasa_get_ranking",
name:window.myName
}));
});
}

// =========================
// ランキング
// =========================
if(data.type==="nasa_ranking"){
showRanking(container,data,false);
}

});

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

}

// =========================
// 個人回答
// =========================
function startPersonal(){

createRankingUI(container,items,(r)=>{

if(!confirm("個人回答を確定しますか？")) return;

socket.send(JSON.stringify({
type:"nasa_personal",
name:window.myName,
ranks:r
}));

container.innerHTML="<h2>しばらくお待ちください...</h2>";

},`${window.myName} の回答`,false);

}

// =========================
// チーム選択
// =========================
function startTeamSelect(){
renderTeamSelect();
}

function renderTeamSelect(){

container.innerHTML="<h2>チームを選択</h2>";

Object.keys(teams).forEach(team=>{
const btn=document.createElement("button");
btn.textContent=team;

btn.onclick=()=>{
myTeam=team;

socket.send(JSON.stringify({
type:"select_team",
name:window.myName,
team:team
}));

startLeaderSelect();
};

container.appendChild(btn);
});

}

// =========================
// リーダー選択
// =========================
function startLeaderSelect(){

container.innerHTML=`<h2>${myTeam} のメンバー</h2>`;

(teams[myTeam]||[]).forEach(member=>{
const btn=document.createElement("button");
btn.textContent=member;

btn.onclick=()=>{
socket.send(JSON.stringify({
type:"set_team_leader",
team:myTeam,
leader:member
}));
};

container.appendChild(btn);
});

}

// =========================
// チーム回答
// =========================
function startTeamAnswer(){

const leader=leaders[myTeam];

const isLeader = leader===window.myName;

createRankingUI(container,items,(r)=>{

if(!isLeader){
alert("リーダーのみ回答できます");
return;
}

if(!confirm("チーム回答を確定しますか？")) return;

socket.send(JSON.stringify({
type:"nasa_team",
name:window.myName,
team:myTeam,
ranks:r
}));

container.innerHTML="<h2>送信完了</h2>";

},`${myTeam} の回答（リーダー: ${leader}）`,true);

}

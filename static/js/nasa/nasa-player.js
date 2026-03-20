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
// チームフェーズ開始
// =========================
if(data.type==="team_phase_start"){
teams=data.teams;
leaders=data.leaders;
startTeamSelect();
}

// =========================
// チーム更新
// =========================
if(data.type==="team_update"){
teams=data.teams;

if(!myTeam){
renderTeamSelect();
}else{
showWaiting("チーム登録完了。他メンバーを待っています...");
}
}

// =========================
// リーダー確定
// =========================
if(data.type==="team_leader_set"){
leaders[data.team]=data.leader;

if(data.team===myTeam){
startTeamAnswer();
}
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

showWaiting("チーム登録完了。他メンバーを待っています...");
};

container.appendChild(btn);
});

}

// =========================
// 待機UI（追加）
// =========================
function showWaiting(msg){

container.innerHTML="";

const h=document.createElement("h2");
h.textContent=msg;
container.appendChild(h);

if(myTeam && teams[myTeam]){
teams[myTeam].forEach(m=>{
const div=document.createElement("div");
div.textContent=m;
container.appendChild(div);
});
}

}

// =========================
// チーム回答
// =========================
function startTeamAnswer(){

const leader=leaders[myTeam];

if(!leader){
showWaiting("リーダー未決定...");
return;
}

const isLeader = leader===window.myName;

// ★ 非リーダー
if(!isLeader){

container.innerHTML=`
<h2>${myTeam} の回答（リーダー: ${leader}）</h2>
<p>リーダーが回答中です...</p>
`;
return;
}

// ★ リーダーのみ入力
createRankingUI(container,items,(r)=>{

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

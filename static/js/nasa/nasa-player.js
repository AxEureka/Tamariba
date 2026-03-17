import { createRankingUI, showCorrect, showRanking } from "./nasa-ui.js";

let socket;
let container;

let items=[];
let personal=[];
let team=[];
let teamName="";

export function startNASAPlayer(ws,uiContainer){

socket=ws;
container=uiContainer;

// ★ 名前の保険（undefined対策）
if(!window.myName){
const params = new URLSearchParams(location.search);
window.myName = params.get("name") || "名無し";
}

socket.addEventListener("message",(e)=>{

let data;
try{data=JSON.parse(e.data);}catch{return;}

if(data.type==="nasa_start"){
items=data.items;
startPersonal();
}

if(data.type==="nasa_result"){
showCorrect(container,items,data.correct,()=>{

socket.send(JSON.stringify({type:"nasa_get_ranking"}));

});

// ★ 追加：いつでも押せるボタン
const btn = document.createElement("button");
btn.textContent = "ランキングを見る";

btn.onclick = ()=>{
socket.send(JSON.stringify({type:"nasa_get_ranking"}));
};

container.appendChild(btn);

}

if(data.type==="nasa_ranking"){
showRanking(container,data,false);
}

});

}

function startPersonal(){

createRankingUI(container,items,(r)=>{

personal=r;

socket.send(JSON.stringify({
type:"nasa_personal",
name:window.myName,
ranks:r
}));

startTeam();

},`${window.myName} の回答`, false); // ← 重複チェックON

}

function startTeam(){

teamName=prompt("チーム名","チームA")||"チーム";

createRankingUI(container,items,(r)=>{

team=r;

// ★ 送信
socket.send(JSON.stringify({
type:"nasa_team",
name:window.myName,
team:teamName,
ranks:r
}));

// ★ ここ追加（超重要）
container.innerHTML = `
<h2>${teamName} の回答送信完了！</h2>
<p>結果発表をお待ちください…</p>
`;

},`${teamName} の回答`, true);

}

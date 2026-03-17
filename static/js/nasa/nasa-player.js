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

},`${window.myName} の回答`);

}

function startTeam(){

teamName=prompt("チーム名","チームA")||"チーム";

createRankingUI(container,items,(r)=>{

team=r;

socket.send(JSON.stringify({
type:"nasa_team",
name:window.myName,
team:teamName,
ranks:r
}));

},`${teamName} の回答`);

}

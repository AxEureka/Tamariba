import { createItemEditor, showRanking } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect=null;
let lastItems=null;

export function startNASAHost(ws,uiContainer){

socket=ws;
container=uiContainer;

createItemEditor(container,(items,correct)=>{

lastItems=items;
lastCorrect=correct;

socket.send(JSON.stringify({
type:"nasa_start",
items:items,
correct:correct
}));

showControl();

});

socket.addEventListener("message",(e)=>{

let data;
try{data=JSON.parse(e.data);}catch{return;}

if(data.type==="nasa_ranking"){
showRanking(container,data,true);
}

});

window.showCorrectAgain=()=>{
if(lastCorrect){
container.innerHTML="";
import("./nasa-ui.js").then(mod=>{
mod.showCorrect(container,lastItems,lastCorrect,()=>{
socket.send(JSON.stringify({type:"nasa_get_ranking"}));
});
});
}
};

}

function showControl(){

container.innerHTML=`
<h2>NASAゲーム進行</h2>
<button id="showResult">正解発表</button>
<button id="showRanking">ランキング</button>
`;

document.getElementById("showResult").onclick=()=>{
socket.send(JSON.stringify({type:"nasa_show_result"}));
};

document.getElementById("showRanking").onclick=()=>{
socket.send(JSON.stringify({type:"nasa_get_ranking"}));
};

}

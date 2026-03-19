import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect=null;
let lastItems=null;
let lastRanking=null;

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
lastRanking=data;
showRanking(container,data,true);

// ★ 追加：ランキング→正解
addBackToCorrectButton();
}

});


// =========================
// ★ 正解再表示
// =========================
window.showCorrectAgain=()=>{
if(lastCorrect){
showCorrect(container,lastItems,lastCorrect,()=>{
socket.send(JSON.stringify({type:"nasa_get_ranking"}));
});
}
};

// =========================
// ★ ランキング再表示
// =========================
window.showRankingAgain=()=>{
if(lastRanking){
showRanking(container,lastRanking,true);
}
};

}


// =========================
// コントロール画面
// =========================
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


container.appendChild(btn);

}

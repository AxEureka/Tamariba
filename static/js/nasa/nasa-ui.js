console.log("nasa-ui loaded");

// =========================
// ★ 追加：問題作成UI（これが抜けてた）
// =========================
export function createItemEditor(container,onSubmit){

container.innerHTML="";

const box=document.createElement("div");
box.className="nasa-ui";

const title=document.createElement("h2");
title.textContent="NASAゲーム設定";
box.appendChild(title);

const countInput=document.createElement("input");
countInput.type="number";
countInput.value=5;
countInput.min=2;
countInput.max=20;

box.appendChild(document.createTextNode("品目数: "));
box.appendChild(countInput);

const itemArea=document.createElement("div");
box.appendChild(itemArea);

function buildItems(){

itemArea.innerHTML="";
const n=parseInt(countInput.value);

for(let i=0;i<n;i++){

const row=document.createElement("div");
row.className="rank-row";

const name=document.createElement("input");
name.placeholder="品目"+(i+1);

const rank=document.createElement("input");
rank.type="number";
rank.placeholder="正解順位";

row.appendChild(name);
row.appendChild(rank);

itemArea.appendChild(row);

}

}

countInput.onchange=buildItems;
buildItems();

const btn=document.createElement("button");
btn.textContent="出題";

btn.onclick=()=>{

const items=[];
const correct=[];

itemArea.querySelectorAll(".rank-row").forEach(row=>{
const inputs=row.querySelectorAll("input");
items.push(inputs[0].value);
correct.push(parseInt(inputs[1].value));
});

onSubmit(items,correct);

};

box.appendChild(btn);
container.appendChild(box);

}


// =========================
// ★ 回答UI（修正版）
// =========================
export function createRankingUI(container,items,onSubmit,title,isTeam=false){

container.innerHTML="";

const box=document.createElement("div");
box.className="nasa-ui";

if(title){
const h=document.createElement("h2");
h.textContent=title;
box.appendChild(h);
}

const selects=[];

items.forEach(item=>{

const row=document.createElement("div");
row.className="rank-row";

const label=document.createElement("span");
label.textContent=item;

const select=document.createElement("select");

const first=document.createElement("option");
first.value="";
first.textContent="選択";
first.disabled=true;
first.selected=true;
select.appendChild(first);

for(let i=1;i<=items.length;i++){
const op=document.createElement("option");
op.value=i;
op.textContent=i;
select.appendChild(op);
}

row.appendChild(label);
row.appendChild(select);

box.appendChild(row);
selects.push(select);

});

const btn=document.createElement("button");
btn.textContent="OK";
btn.disabled=true;

function checkDuplicate(){

const values=selects.map(s=>s.value).filter(v=>v!="");

let dup=[];

values.forEach(v=>{
if(values.filter(x=>x===v).length>1) dup.push(v);
});

// ハイライト
selects.forEach(s=>{
if(dup.includes(s.value)){
s.style.background="#ff6b6b";
}else{
s.style.background="";
}
});

// ボタン制御
if(isTeam){
btn.disabled = values.length!=items.length;
}else{
btn.disabled = dup.length>0 || values.length!=items.length;
}

}

selects.forEach(s=>s.onchange=checkDuplicate);

btn.onclick=()=>{
const ranks=selects.map(s=>parseInt(s.value));
onSubmit(ranks);
};

box.appendChild(btn);
container.appendChild(box);

}


// =========================
// 正解表示
// =========================
export function showCorrect(container,items,correct,onRanking){

container.innerHTML="<h2>正解順位</h2>";

const box = document.createElement("div");
box.className = "result-box";

items.forEach((item,i)=>{
const div=document.createElement("div");
div.className="result-item";
div.textContent=`${item} ： ${correct[i]}`;
box.appendChild(div);
});

container.appendChild(box);

const btn=document.createElement("button");
btn.textContent="ランキングを見る";
btn.onclick=onRanking;
container.appendChild(btn);

}

// =========================
// ランキング表示
// =========================
export function showRanking(container,data,isHost){

container.innerHTML="<h2>ランキング</h2>";

let html="<h3>個人トップ3</h3>";

data.personal_top.forEach((p,i)=>{
html+=`${i+1}. ${p.name} (${p.score})<br>`;
});

html+=`<br>個人平均: ${data.personal_avg}<br>`;

if(!isHost){
html+=`あなたの得点: ${data.my_personal}<br>`;
}

html+="<hr><h3>チームトップ3</h3>";

data.team_top.forEach((t,i)=>{
html+=`${i+1}. ${t.name} (${t.score})<br>`;
});

html+=`<br>チーム平均: ${data.team_avg}<br>`;

if(!isHost){
html+=`あなたのチーム: ${data.my_team}<br>`;
}

container.innerHTML+=html;

}

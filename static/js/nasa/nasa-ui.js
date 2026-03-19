console.log("nasa-ui loaded");

// =========================
// 問題作成UI
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

// ★ ドロップダウン
const rank=document.createElement("select");

for(let j=1;j<=n;j++){
const op=document.createElement("option");
op.value=j;
op.textContent=j;
rank.appendChild(op);
}

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

if(!confirm("出題しますか？")) return;

const items=[];
const correct=[];

itemArea.querySelectorAll(".rank-row").forEach(row=>{
const inputs=row.querySelectorAll("input, select");
items.push(inputs[0].value);
correct.push(parseInt(inputs[1].value));
});

onSubmit(items,correct);

};

box.appendChild(btn);
container.appendChild(box);
}


// =========================
// 回答UI
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

selects.forEach(s=>{
if(dup.includes(s.value)){
s.style.background="#ff6b6b";
}else{
s.style.background="";
}
});

if(isTeam){
btn.disabled = values.length!=items.length;
}else{
btn.disabled = dup.length>0 || values.length!=items.length;
}

}

selects.forEach(s=>s.onchange=checkDuplicate);


box.appendChild(btn);
container.appendChild(box);

}


// =========================
// 正解表示
// =========================
export function showCorrect(container,items,correct,onRanking){

container.innerHTML="<h2>正解順位</h2>";

const box=document.createElement("div");
box.className="result-box";

items.forEach((item,i)=>{
const div=document.createElement("div");
div.className="result-item";
div.textContent=`${item} ： ${correct[i]}`;
box.appendChild(div);
});

container.appendChild(box);

// ランキングボタン（1つだけ）
const btn=document.createElement("button");
btn.textContent="ランキングを見る";
btn.onclick=onRanking;
container.appendChild(btn);

}


// =========================
// ランキング表示
// =========================
export function showRanking(container,data,isHost){

container.innerHTML="";

const wrap=document.createElement("div");
wrap.className="ranking-wrap";

// 個人
const personal=document.createElement("div");
personal.className="ranking-box";

let html1=`<h2>🏆 個人ランキング</h2>`;

data.personal_top.forEach((p,i)=>{
html1+=`<div class="rank-line ${i===0?"rank-1":""}">
${i+1}位：${p.name}（${p.score}）
</div>`;
});

html1+=`<hr><div>平均：${data.personal_avg}</div>`;

if(!isHost){
html1+=`<div>あなた：${data.my_personal ?? "-"}</div>`;
}

personal.innerHTML=html1;

// チーム
const team=document.createElement("div");
team.className="ranking-box";

let html2=`<h2>👥 チームランキング</h2>`;

data.team_top.forEach((t,i)=>{
html2+=`<div class="rank-line ${i===0?"rank-1":""}">
${i+1}位：${t.name}（${t.score}）
</div>`;
});

html2+=`<hr><div>平均：${data.team_avg}</div>`;

if(!isHost){
html2+=`<div>あなたのチーム：${data.my_team ?? "-"}</div>`;
}

team.innerHTML=html2;

// ===================
// 結合
// ===================
wrap.appendChild(personal);
wrap.appendChild(team);

// ★ ここから修正
const btnArea=document.createElement("div");
btnArea.style.marginTop="20px";

const backBtn=document.createElement("button");
backBtn.textContent="正解を見る";

// 安全に存在チェック
backBtn.onclick=()=>{
if(window.showCorrectAgain){
window.showCorrectAgain();
}
};

btnArea.appendChild(backBtn);
wrap.appendChild(btnArea);
// ★ ここまで

container.appendChild(wrap);
}

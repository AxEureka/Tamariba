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

// ★ 重複ハイライトは常にやる（UI的に良い）
selects.forEach(s=>{
if(dup.includes(s.value)){
s.style.background="#ff6b6b";
}else{
s.style.background="";
}
});

// ★ ここが修正ポイント
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

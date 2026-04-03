console.log("nasa-ui loaded");

// =========================
// 問題作成UI（変更なし）
// =========================
export function createItemEditor(container,onSubmit){

const DEFAULT_SET = {
  items: ["パラシュート", "箱に入ったマッチ", "宇宙食", "45口径ピストル2丁", "粉ミルク1ケース", "酸素ボンベ2本", "15mのナイロン製ロープ", "ソーラー発電式の携帯用ヒーター", "月面用の星図表", "自動的に膨らむ救命ボート", "方位磁石", "水19L", "注射器の入った救急箱", "太陽電池のFM送受信器", "照明弾"],
  correct: [8, 15, 4, 11, 12, 1, 6, 13, 3, 9, 14, 2, 7, 5, 10]
};

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

const selects=[];

for(let i=0;i<n;i++){

const row=document.createElement("div");
row.className="rank-row";

const name=document.createElement("input");
name.placeholder="品目"+(i+1);

const rank=document.createElement("select");

const first=document.createElement("option");
first.value="";
first.textContent="選択";
first.disabled=true;
first.selected=true;
rank.appendChild(first);

for(let j=1;j<=n;j++){
const op=document.createElement("option");
op.value=j;
op.textContent=j;
rank.appendChild(op);
}

row.appendChild(name);
row.appendChild(rank);
itemArea.appendChild(row);

selects.push(rank);
}

function checkDuplicate(){

  const values=selects.map(s=>s.value).filter(v=>v!="");

  let dup=[];
  values.forEach(v=>{
    if(values.filter(x=>x===v).length>1) dup.push(v);
  });

  selects.forEach(s=>{
    s.style.background = dup.includes(s.value) ? "#ff6b6b" : "";
  });

  const hasEmpty = selects.some(s => s.value==="");

  const isTeamMode = typeof isTeam !== "undefined" ? isTeam : false;

  if(isTeamMode){
    btn.disabled = !isLeader || hasEmpty;
  } else {
    btn.disabled = dup.length>0 || hasEmpty;
  }
}
selects.forEach(s=>s.onchange=checkDuplicate);

}

countInput.onchange=buildItems;
buildItems();

const defaultBtn=document.createElement("button");
defaultBtn.textContent="デフォルトを使う";

defaultBtn.onclick=()=>{
  countInput.value = DEFAULT_SET.items.length;
  buildItems();
  const rows = itemArea.querySelectorAll(".rank-row");
  rows.forEach((row,i)=>{
    const inputs=row.querySelectorAll("input, select");
    inputs[0].value = DEFAULT_SET.items[i];
    inputs[1].value = DEFAULT_SET.correct[i];
  });

  // ★追加
  setTimeout(() => {
    const event = new Event("change");
    itemArea.querySelectorAll("select").forEach(s => s.dispatchEvent(event));
  }, 0);
};

box.appendChild(defaultBtn);

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
// 回答UI（★修正済み）
// =========================
export function createRankingUI(
  container,
  items,
  onSubmit,
  title,
  isTeam=false,
  isLeader=true,
  userId=null,      // ★追加: プレイヤーID
  userName=null     // ★追加: プレイヤー名
){

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

    if(!isLeader){
      select.disabled=true;
    }

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

  btn.disabled = true;

  function checkDuplicate(){
    const values = selects.map(s => s.value).filter(v => v !== "");
    let dup = [];
    values.forEach(v=>{
      if(values.filter(x=>x===v).length > 1) dup.push(v);
    });

    selects.forEach(s=>{
      s.style.background = dup.includes(s.value) ? "#ff6b6b" : "";
    });

    const hasEmpty = selects.some(s => s.value === "");
    btn.disabled = dup.length > 0 || hasEmpty || !isLeader;
  }

  selects.forEach(s => s.addEventListener("change", checkDuplicate));
  checkDuplicate();

  btn.onclick=()=>{
    if(!isLeader){
      alert("リーダーのみ操作できます");
      return;
    }

    const ranks = selects.map(s => parseInt(s.value));

    // ★ID付きで送信
    onSubmit({
      id: userId,
      name: userName,
      ranks
    });
  };

  box.appendChild(btn);
  container.appendChild(box);
}

// =========================
// 正解表示（変更なし）
// =========================
export function showCorrect(container,items,correct,onRanking){

document.querySelectorAll(".ranking-wrap").forEach(el => el.remove());

container.innerHTML="";

const box=document.createElement("div");
box.className="nasa-ui";

const title=document.createElement("h2");
title.textContent="正解順位";
box.appendChild(title);

const resultBox=document.createElement("div");
resultBox.className="result-box";

items.forEach((item,i)=>{
  const div=document.createElement("div");
  div.className="result-item";
  div.textContent=`${item} ： ${correct[i]}`;
  resultBox.appendChild(div);
});

box.appendChild(resultBox);

const btn=document.createElement("button");
btn.textContent="ランキングを見る";

btn.onclick=()=>{
  console.log("ランキング押された");
  onRanking();
};

box.appendChild(btn);
container.appendChild(box);

}


// =========================
// ランキング表示（変更なし）
// =========================
export function showRanking(container,data,isHost){

document.querySelectorAll(".ranking-wrap").forEach(el => el.remove());

container.innerHTML="";

const wrap=document.createElement("div");
wrap.className="ranking-wrap";

wrap.style.display="flex";
wrap.style.flexDirection="column";
wrap.style.alignItems="center";

// ★2列部分
const row=document.createElement("div");
row.style.display="flex";
row.style.gap="30px";
row.style.justifyContent="center";

const personal=document.createElement("div");
personal.className="ranking-box";

let html1=`<h2>🏆 個人ランキング</h2>`;

// ★グループ化
const groups = {};
data.personal_top.forEach(p=>{
  if(!groups[p.score]) groups[p.score] = [];
  groups[p.score].push(p);
});

// ★昇順（小さいほど上位）
const sortedScores = Object.keys(groups)
  .map(Number)
  .sort((a,b)=>a-b);

let rank = 1;

for(const score of sortedScores){

  const players = groups[score];

  players.forEach((p,i)=>{
    const isMe = (!isHost && p.name === window.myName);

    html1+=`
      <div style="${isMe ? 'color: yellow; font-weight: bold;' : ''}">
        ${i===0 ? `${rank}位：` : `　　　`}
        ${p.name}（${p.score}）
      </div>
    `;
  });

  rank++;

  // ★3位まで出したら終了
  if(rank > 3) break;
}
  
html1+=`<hr><div>平均：${data.personal_avg}</div>`;
if(!isHost){
html1+=`<div>あなた：${data.my_personal ?? "-"}</div>`;
}
personal.innerHTML=html1;

const team=document.createElement("div");
team.className="ranking-box";

let html2=`<h2>👥 チームランキング</h2>`;

const teamGroups = {};
data.team_top.forEach(t=>{
  if(!teamGroups[t.score]) teamGroups[t.score] = [];
  teamGroups[t.score].push(t);
});

// ★昇順
const sortedTeamScores = Object.keys(teamGroups)
  .map(Number)
  .sort((a,b)=>a-b);

let teamRank = 1;

for(const score of sortedTeamScores){

  const teams = teamGroups[score];

  teams.forEach((t,i)=>{
    const isMyTeam = (!isHost && t.name === data.my_team_name);

    html2+=`
      <div style="${isMyTeam ? 'color: yellow; font-weight: bold;' : ''}">
        ${i===0 ? `${teamRank}位：` : `　　　`}
        ${t.name}（${t.score}）
      </div>
    `;
  });

  teamRank++;

  if(teamRank > 3) break;
}
  
html2+=`<hr><div>平均：${data.team_avg}</div>`;
if(!isHost){
html2+=`<div>あなたのチーム：${data.my_team_score ?? "-"}</div>`;
}
team.innerHTML=html2;

row.appendChild(personal);
row.appendChild(team);

wrap.appendChild(row);

// ★ボタン
const btnArea=document.createElement("div");
btnArea.style.marginTop="15px";

const backBtn=document.createElement("button");
backBtn.textContent="正解を見る";

backBtn.onclick=()=>{
if(window.showCorrectAgain){
window.showCorrectAgain();
}
};

btnArea.appendChild(backBtn);
wrap.appendChild(btnArea);

container.appendChild(wrap);
}

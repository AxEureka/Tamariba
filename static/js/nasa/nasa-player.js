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

    if(data.type==="start_nasa"){
      items=data.items;
      startPersonal();
    }

    if(data.type==="team_phase_start"){
      teams=data.teams;
      startTeamSelect();
    }

    if(data.type==="team_update"){
      teams=data.teams;

      if(!myTeam){
        renderTeamSelect();
      }else{
        showWaiting("チーム登録完了。他メンバーを待っています...");
      }
    }

    if(data.type==="leader_phase_start"){
      teams=data.teams;

      if(myTeam){
        renderLeaderSelect();
      }else{
        showWaiting("リーダー選択フェーズ待機中...");
      }
    }

    if(data.type==="team_leader_set"){
      leaders[data.team]=data.leader;

      if(data.team===myTeam){
        startTeamAnswer();
      }
    }

    if(data.type==="nasa_result"){
      lastCorrect=data.correct;

      showDetailedCorrect(
        container,
        items,
        data.correct,
        data.personal_answers,
        data.team_answers
      );
    }

    if(data.type==="nasa_ranking"){
      showRanking(container,data,false);
      showAdvancedMessages(data);
    }

  });

  window.showCorrectAgain=()=>{
    if(lastCorrect){
      socket.send(JSON.stringify({
        type:"nasa_show_result"
      }));
    }
  };

}

// =========================
// ★正解詳細表示
// =========================
function showDetailedCorrect(container,items,correct,personalAnswers,teamAnswers){

  container.innerHTML="";

  const box=document.createElement("div");
  box.className="nasa-ui";

  const title=document.createElement("h2");
  title.textContent="正解と比較";
  box.appendChild(title);

  // ★致命バグ修正（ここ追加）
  const myName = window.myName;
  const myData = personalAnswers?.[myName] || {};
  const myRanks = myData.personal || [];
  const myTeamName = myData.team_name;
  const teamRanks = teamAnswers?.[myTeamName] || [];

  // ★ヘッダー
  const header=document.createElement("div");
  header.style.display="flex";
  header.style.justifyContent="space-between";
  header.style.gap="10px";
  header.style.fontWeight="bold";

  header.innerHTML=`
    <div style="flex:2">品目</div>
    <div style="flex:1">正解</div>
    <div style="flex:1">あなた</div>
    <div style="flex:1">チーム</div>
  `;

  box.appendChild(header);

  items.forEach((item,i)=>{

    const c = correct[i];
    const p = myRanks[i];
    const t = teamRanks[i];

    const pDiff = p!=null ? Math.abs(p-c) : "-";
    const tDiff = t!=null ? Math.abs(t-c) : "-";

    const row=document.createElement("div");
    row.style.display="flex";
    row.style.justifyContent="space-between";
    row.style.gap="10px";

    row.innerHTML=`
      <div style="flex:2">${item}</div>
      <div style="flex:1">${c}</div>
      <div style="flex:1">
        ${p ?? "-"} <span style="color:#888">(${pDiff})</span>
      </div>
      <div style="flex:1">
        ${t ?? "-"} <span style="color:#888">(${tDiff})</span>
      </div>
    `;

    box.appendChild(row);
  });

  const btn=document.createElement("button");
  btn.textContent="ランキングを見る";

  btn.onclick=()=>{
    socket.send(JSON.stringify({
      type:"nasa_get_ranking",
      name:window.myName
    }));
  };

  box.appendChild(btn);
  container.appendChild(box);
}

// =========================
// ★ランキングメッセージ
// =========================
function showAdvancedMessages(data){

  const personal = data.my_personal;
  const team = data.my_team_score;

  if(personal == null || team == null) return;

  const wrap = document.querySelector(".ranking-wrap");
  const boxes = wrap.querySelectorAll(".ranking-box");

  if(boxes.length < 2) return;

  const diff = personal - team;

  function getScoreMsg(score){
    if(score <= 10) return "ほぼ完璧な判断";
    if(score <= 30) return "かなり優秀な判断";
    if(score <= 60) return "まずまずの判断";
    return "ズレあり";
  }

  function getDiffMsg(diff){
    if(diff === 0) return "完全一致！理想的！";
    if(diff > 0){
      if(diff <= 10) return "チームの方が少し良い結果";
      if(diff <= 30) return "チームで判断する方が正確！";
      return "困ったらチームで話し合おう！";
    }else{
      const d=Math.abs(diff);
      if(d <= 10) return "一人の方が少し良い結果";
      if(d <= 30) return "一人で判断する方が正確！";
      return "困ったら一人だけで決断しよう！";
    }
  }

  const pMsg=document.createElement("div");
  pMsg.style.marginTop="10px";
  pMsg.style.textAlign="center";
  pMsg.style.fontWeight="bold";
  pMsg.style.fontSize="18px";
  pMsg.textContent=getScoreMsg(personal);
  boxes[0].appendChild(pMsg);

  const tMsg=document.createElement("div");
  tMsg.style.marginTop="10px";
  tMsg.style.textAlign="center";
  tMsg.style.fontWeight="bold";
  tMsg.style.fontSize="18px";
  tMsg.textContent=getScoreMsg(team);
  boxes[1].appendChild(tMsg);

  [pMsg, tMsg].forEach(el=>{
    el.style.background="rgba(0,0,0,0.7)";
    el.style.color="white";
    el.style.padding="8px";
    el.style.borderRadius="8px";
  });

  const diffBox=document.createElement("div");
  diffBox.style.background="black";
  diffBox.style.color="white";
  diffBox.style.padding="12px";
  diffBox.style.borderRadius="10px";
  diffBox.style.fontSize="18px";
  diffBox.style.textAlign="center";
  diffBox.style.fontWeight="bold";
  diffBox.style.boxShadow="0 0 10px rgba(0,0,0,0.5)";

  diffBox.innerHTML=`
    <div>個人得点 ー チーム得点：${diff}</div>
    <div>${getDiffMsg(diff)}</div>
  `;

  wrap.appendChild(diffBox);
}

// =========================
// ★元の関数
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

function startTeamSelect(){
  renderTeamSelect();
}

function renderTeamSelect(){

  container.innerHTML="";
  container.style.pointerEvents="auto";

  const title=document.createElement("h2");
  title.textContent="チームを選択";
  container.appendChild(title);

  const select=document.createElement("select");

  const def=document.createElement("option");
  def.textContent="選択してください";
  def.value=""; // ★修正
  def.disabled=true;
  def.selected=true;
  select.appendChild(def);

  Object.keys(teams).forEach(team=>{
    const opt=document.createElement("option");
    opt.value=team;
    opt.textContent=team;
    select.appendChild(opt);
  });

  container.appendChild(select);

  const btn=document.createElement("button");
  btn.textContent="決定";

  btn.disabled = true; // ★修正

  select.onchange = () => {
    btn.disabled = !select.value; // ★修正
  };

  btn.onclick=()=>{
    const team=select.value;

    if(!team){
      alert("チームを選択してください");
      return;
    }

    myTeam=team;

    socket.send(JSON.stringify({
      type:"select_team",
      name:window.myName,
      team:team
    }));

    showWaiting("チーム登録完了。他メンバーを待っています...");
  };

  container.appendChild(btn);
}

function renderLeaderSelect(){

  container.innerHTML="<h2>リーダーを選択</h2>";

  const members = teams[myTeam] || [];

  const select=document.createElement("select");

  const def=document.createElement("option");
  def.textContent="選択してください";
  def.disabled=true;
  def.selected=true;
  select.appendChild(def);

  members.forEach(m=>{
    const opt=document.createElement("option");
    opt.value=m;
    opt.textContent=m;
    select.appendChild(opt);
  });

  container.appendChild(select);

  const btn=document.createElement("button");
  btn.textContent="決定";

  btn.onclick=()=>{
    const leader=select.value;
    if(!leader) return;

    socket.send(JSON.stringify({
      type:"set_team_leader",
      team:myTeam,
      leader:leader
    }));

    showWaiting(`${leader} をリーダーに設定中...`);
  };

  container.appendChild(btn);
}

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

function startTeamAnswer(){

  const leader=leaders[myTeam];

  if(!leader){
    showWaiting("リーダー未決定...");
    return;
  }

  const isLeader = leader===window.myName;

  if(!isLeader){
    container.innerHTML=`
      <h2>${myTeam} の回答（リーダー: ${leader}）</h2>
      <p>リーダーが回答中です...</p>
    `;
    return;
  }

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

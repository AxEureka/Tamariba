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

    // 個人回答
    if(data.type==="start_nasa"){
      items=data.items;
      startPersonal();
    }

    // チーム選択
    if(data.type==="team_phase_start"){
      teams=data.teams;
      startTeamSelect();
    }

    // チーム更新
    if(data.type==="team_update"){
      teams=data.teams;

      if(!myTeam){
        renderTeamSelect();
      }else{
        showWaiting("チーム登録完了。他メンバーを待っています...");
      }
    }

    // リーダー選択
    if(data.type==="leader_phase_start"){
      teams=data.teams;

      if(myTeam){
        renderLeaderSelect();
      }else{
        showWaiting("リーダー選択フェーズ待機中...");
      }
    }

    // リーダー確定
    if(data.type==="team_leader_set"){
      leaders[data.team]=data.leader;

      if(data.team===myTeam){
        startTeamAnswer();
      }
    }

    // 結果
    if(data.type==="nasa_result"){
      lastCorrect=data.correct;

      showCorrect(container,items,data.correct,()=>{
        socket.send(JSON.stringify({
          type:"nasa_get_ranking",
          name:window.myName
        }));
      });
    }

    // ランキング
    if(data.type==="nasa_ranking"){
      showRanking(container,data,false);

      // ★差分表示
      showMyResultDiff(data);
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
// ★差分表示
// =========================
function showMyResultDiff(data){

  const personal = data.my_personal;
  const team = data.my_team_score;

  if(personal == null || team == null) return;

  const diff = personal - team;

  const div = document.createElement("div");
  div.style.marginTop = "20px";
  div.style.fontWeight = "bold";

  let msg = "";

  if(diff > 0){
    msg = "チームの方が優秀！";
  }else if(diff < 0){
    msg = "あなたの方が鋭い！";
  }else{
    msg = "完全一致！すごい！";
  }

  div.innerHTML = `
    <p>あなたの個人得点：${personal}</p>
    <p>チーム得点：${team}</p>
    <p>差分：${diff}</p>
    <p>${msg}</p>
  `;

  container.appendChild(div);
}

// =========================
// 以下既存そのまま
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

  btn.onclick=()=>{
    const team=select.value;
    if(!team) return;

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

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

    // =========================
    // ★正解（強化版）
    // =========================
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

    // =========================
    // ★ランキング（強化版）
    // =========================
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

  const myName = window.myName;

  const myData = personalAnswers?.[myName] || {};
  const myRanks = myData.personal || [];

  const myTeamName = myData.team_name;
  const teamRanks = teamAnswers?.[myTeamName] || [];

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
    row.style.padding="4px 0";

    row.innerHTML=`
      <div style="flex:2">${item}</div>
      <div style="flex:1">正解：${c}</div>
      <div style="flex:1">あなた：${p ?? "-"}（${pDiff}）</div>
      <div style="flex:1">チーム：${t ?? "-"}（${tDiff}）</div>
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
// ★ランキングメッセージ強化
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
    if(score <= 10) return "ほぼ完璧！";
    if(score <= 30) return "かなり優秀";
    if(score <= 60) return "まずまず";
    return "ズレあり";
  }

  function getDiffMsg(diff){
    if(diff === 0) return "完全一致！理想的！";
    if(diff > 0){
      if(diff <= 10) return "チームの方が少し良い";
      if(diff <= 30) return "チームで大きく改善！";
      return "チーム判断が圧勝！";
    }else{
      const d=Math.abs(diff);
      if(d <= 10) return "あなたの方が少し良い";
      if(d <= 30) return "あなたの判断が光る！";
      return "あなたが圧倒的に正確！";
    }
  }

  // 個人下
  const pMsg=document.createElement("div");
  pMsg.style.marginTop="10px";
  pMsg.style.textAlign="center";
  pMsg.style.fontWeight="bold";
  pMsg.textContent=getScoreMsg(personal);
  boxes[0].appendChild(pMsg);

  // チーム下
  const tMsg=document.createElement("div");
  tMsg.style.marginTop="10px";
  tMsg.style.textAlign="center";
  tMsg.style.fontWeight="bold";
  tMsg.textContent=getScoreMsg(team);
  boxes[1].appendChild(tMsg);

  // 差分
  const diffBox=document.createElement("div");
  diffBox.style.marginTop="20px";
  diffBox.style.textAlign="center";
  diffBox.style.fontWeight="bold";

  diffBox.innerHTML=`
    <div>差分：${diff}</div>
    <div>${getDiffMsg(diff)}</div>
  `;

  wrap.appendChild(diffBox);
}

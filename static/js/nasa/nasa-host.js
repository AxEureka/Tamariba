console.log("nasa-host loaded");

import { createItemEditor, showCorrect, showRanking } from "./nasa-ui.js";

let ws;
let container;
let lastItems = null;
let lastCorrect = null;
let teamData = {};   // playerId => teamId
let playerData = {}; // playerId => {name, ranks}

export function startNASAHost(socket, uiContainer){
    ws = socket;
    container = uiContainer;

    showTeamSetup(()=>{
        createItemEditor(container, (items, correct)=>{
            // 内部処理はIDなしで名前だけ渡す
            lastItems = items.map((name,i)=>({id:i+1, name}));
            lastCorrect = correct;
            broadcast({type:"start_question", items:lastItems});
        });
    });
}

// チーム設定UI
function showTeamSetup(callback){
    container.innerHTML="";
    const box=document.createElement("div");
    box.className="nasa-ui";
    const h=document.createElement("h2");
    h.textContent="チーム設定";
    box.appendChild(h);
    const btn=document.createElement("button");
    btn.textContent="開始";
    btn.onclick=callback;
    box.appendChild(btn);
    container.appendChild(box);
}

// ★WebSocket全体ブロードキャスト
function broadcast(msg){
    ws.send(JSON.stringify({type:"broadcast", data:msg}));
}

// プレイヤー回答受信
export function onPlayerSubmit(playerId, playerName, ranks){
    playerData[playerId] = {name: playerName, ranks};
    // 全員揃ったら正解表示
    if(Object.keys(playerData).length === expectedPlayerCount()){
        broadcast({type:"show_correct", items:lastItems, correct:lastCorrect});
    }
}

// 正解表示
function showCorrectPhase(items, correct){
    showCorrect(container, items, correct, ()=>{
        showRankingPhase(calculateRanking());
    });
}

// ランキング表示
function showRankingPhase(data){
    showRanking(container, data, true);
}

// ランキング計算
function calculateRanking(){
    let personal_scores=[];
    let team_scores={};
    for(let playerId in playerData){
        const {name, ranks} = playerData[playerId];
        let score=0;
        ranks.forEach((v,i)=>{ score+=Math.abs(v - lastCorrect[i]); });
        personal_scores.push({id:playerId, name:name, score:score});
        const teamId = teamData[playerId];
        if(teamId){
            if(!team_scores[teamId]) team_scores[teamId] = {name:"チーム"+teamId, score:0};
            team_scores[teamId].score += score;
        }
    }
    personal_scores.sort((a,b)=>a.score-b.score);
    const personal_avg = personal_scores.reduce((a,b)=>a+b.score,0)/personal_scores.length;
    const team_top = Object.values(team_scores).sort((a,b)=>a.score-b.score);
    const team_avg = Object.values(team_scores).reduce((a,b)=>a+b.score,0)/Object.values(team_scores).length;
    return {
        personal_top:personal_scores,
        team_top:team_top,
        personal_avg:personal_avg,
        team_avg:team_avg,
        my_team_id:null,
        my_team_score:null,
        my_personal:null
    };
}

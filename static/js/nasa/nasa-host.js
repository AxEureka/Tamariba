console.log("nasa-host loaded");

import { createItemEditor, showCorrect, showRanking } from "./nasa-ui.js";

let ws;
let container;
let lastItems = null;
let lastCorrect = null;
let teamData = {};
let playerData = {};

export function startNASAHost(socket, uiContainer){
    ws = socket;
    container = uiContainer;

    showTeamSetup(()=>{
        createItemEditor(container, (items, correct)=>{
            lastItems = items;
            lastCorrect = correct;
            broadcast({type:"start_question", items:items});
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
function onPlayerSubmit(player, ranks){
    playerData[player] = ranks;
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
    // 個人平均、チーム平均
    let personal_scores=[];
    let team_scores={};
    for(let player in playerData){
        const ranks = playerData[player];
        let score=0;
        ranks.forEach((v,i)=>{ score+=Math.abs(v - lastCorrect[i]); });
        personal_scores.push({name:player, score:score});
        if(teamData[player]){
            const t = teamData[player];
            if(!team_scores[t]) team_scores[t]=0;
            team_scores[t]+=score;
        }
    }
    personal_scores.sort((a,b)=>a.score-b.score);
    const personal_avg = personal_scores.reduce((a,b)=>a+b.score,0)/personal_scores.length;
    const team_top = Object.entries(team_scores).map(([k,v])=>({name:k, score:v})).sort((a,b)=>a.score-b.score);
    const team_avg = Object.values(team_scores).reduce((a,b)=>a+b,0)/Object.values(team_scores).length;
    return {
        personal_top:personal_scores,
        team_top:team_top,
        personal_avg:personal_avg,
        team_avg:team_avg,
        my_team_name:null,
        my_team_score:null,
        my_personal:null
    };
}

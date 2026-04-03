import { createRankingUI } from "./nasa-ui.js";

let socket;
let container;

export function startNASAPlayer(ws, uiContainer){
    socket = ws;
    container = uiContainer;

    socket.addEventListener("message", (ev)=>{
        const data = JSON.parse(ev.data);
        if(data.type==="start"){
            showRankingPhase(data.items, data.correct);
        } else if(data.type==="showCorrect"){
            showCorrectPhase(data.items, data.correct);
        } else if(data.type==="ranking"){
            showRankingPhaseFromHost(data.ranking);
        }
    });
}

// =========================
// 回答フェーズ
// =========================
function showRankingPhase(items, correct){
    createRankingUI(container, items, (ranks)=>{
        socket.send(JSON.stringify({ type:"submitRanking", ranks }));
    }, "NASA回答", false, true);
}

// =========================
// 正解フェーズ
// =========================
function showCorrectPhase(items, correct){
    createRankingUI(container, items, (ranks)=>{
        // ★プレイヤー側は送信なし
    }, "正解を見る", false, false);
}

// =========================
// ホストからのランキング表示
// =========================
function showRankingPhaseFromHost(ranking){
    // 表示のみ
    container.innerHTML = "<h2>ランキング</h2>";
    ranking.personal_top.forEach((p,i)=>{
        const div=document.createElement("div");
        div.textContent=`${i+1}位：${p.name} (${p.score})`;
        container.appendChild(div);
    });
}

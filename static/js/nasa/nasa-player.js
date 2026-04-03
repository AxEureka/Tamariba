console.log("nasa-player loaded");

let ws;
let container;
let myName;
let myTeam;
let myLeader = false;
let lastItems = null;
let lastCorrect = null;

export function startNASAPlayer(socket, uiContainer, playerName){
    ws = socket;
    container = uiContainer;
    myName = playerName;

    function send(msg){
        ws.send(JSON.stringify(msg));
    }

    ws.onmessage = (evt)=>{
        const data = JSON.parse(evt.data);
        switch(data.type){
            case "request_name":
                send({type:"player_name", name:myName});
                break;
            case "team_setup":
                showTeamSelection(data.teams, data.leader, (team)=>{
                    myTeam = team;
                    myLeader = data.leader.includes(team);
                    send({type:"team_selected", team:team});
                });
                break;
            case "start_question":
                lastItems = data.items;
                showAnswerPhase(data.items, myLeader, (ranks)=>{
                    send({type:"submit_ranks", ranks:ranks});
                });
                break;
            case "show_correct":
                lastCorrect = data.correct;
                window.showCorrectAgain = () => showCorrectPhase(lastItems, lastCorrect);
                showCorrectPhase(data.items, data.correct);
                break;
            case "show_ranking":
                showRankingPhase(data.ranking, false);
                break;
        }
    }
}

// チーム選択UI
function showTeamSelection(teams, leaders, callback){
    container.innerHTML="";
    const box=document.createElement("div");
    box.className="nasa-ui";
    const h=document.createElement("h2");
    h.textContent="チームを選択してください";
    box.appendChild(h);
    teams.forEach(team=>{
        const btn=document.createElement("button");
        btn.textContent = `${team} ${leaders.includes(team) ? "(リーダー候補)" : ""}`;
        btn.onclick=()=>{ callback(team); };
        box.appendChild(btn);
    });
    container.appendChild(box);
}

// 回答フェーズ
function showAnswerPhase(items, isLeader, callback){
    window.showCorrectAgain = null;
    import("./nasa-ui.js").then(ui=>{
        ui.createRankingUI(container, items, callback, "回答してください", false, isLeader);
    });
}

// 正解表示
function showCorrectPhase(items, correct){
    import("./nasa-ui.js").then(ui=>{
        ui.showCorrect(container, items, correct, ()=>{
            ws.send({type:"request_ranking"});
        });
    });
}

// ランキング表示
function showRankingPhase(data, isHost){
    import("./nasa-ui.js").then(ui=>{
        ui.showRanking(container, data, isHost);
    });
}

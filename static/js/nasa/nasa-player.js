console.log("nasa-player loaded");

let ws;
let container;
let myId;
let myName;
let myTeamId;
let myTeamName;
let myLeader = false;
let lastItems = null;
let lastCorrect = null;

export function startNASAPlayer(socket, uiContainer, playerInfo){
    ws = socket;
    container = uiContainer;
    myId = playerInfo.id;
    myName = playerInfo.name;

    function send(msg){
        ws.send(JSON.stringify(msg));
    }

    ws.onmessage = (evt)=>{
        const data = JSON.parse(evt.data);
        switch(data.type){
            case "request_name":
                send({type:"player_info", id:myId, name:myName});
                break;
            case "team_setup":
                showTeamSelection(data.teams, data.leaderIds, (team)=>{
                    myTeamId = team.id;
                    myTeamName = team.name;
                    myLeader = data.leaderIds.includes(team.id);
                    send({type:"team_selected", id:myId, teamId:team.id});
                });
                break;
            case "start_question":
                lastItems = data.items;
                showAnswerPhase(data.items, myLeader, (ranks)=>{
                    send({type:"submit_ranks", id:myId, ranks:ranks});
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
function showTeamSelection(teams, leaderIds, callback){
    container.innerHTML="";
    const box=document.createElement("div");
    box.className="nasa-ui";
    const h=document.createElement("h2");
    h.textContent="チームを選択してください";
    box.appendChild(h);
    teams.forEach(team=>{
        const btn=document.createElement("button");
        btn.textContent = `${team.name} ${leaderIds.includes(team.id) ? "(リーダー候補)" : ""}`;
        btn.onclick=()=>{ callback(team); };
        box.appendChild(btn);
    });
    container.appendChild(box);
}

// 回答フェーズ
function showAnswerPhase(items, isLeader, callback){
    window.showCorrectAgain = null;
    import("./nasa-ui.js").then(ui=>{
        // itemsは {id, name} 形式にして渡す
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

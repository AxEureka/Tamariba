import { createItemEditor, showRanking, showCorrect } from "./nasa-ui.js";

let socket;
let container;

let lastCorrect = null;
let lastItems = null;
let lastRanking = null;

let teamCount = 2;

// ★進捗表示用
let progressDiv = null;

export function startNASAHost(ws, uiContainer) {
    socket = ws;
    container = uiContainer;

    showTeamSetup(() => {

        createItemEditor(container, (items, correct) => {

            lastItems = items;
            lastCorrect = correct;

            socket.send(JSON.stringify({
                type: "start",
                items,
                correct
            }));

            showCorrect(container, items, correct, () => {
                socket.send(JSON.stringify({ type: "requestRanking" }));
            });
        });
    });
}

// =========================
// チーム設定UI
// =========================
function showTeamSetup(onSubmit){
    container.innerHTML="";
    const box=document.createElement("div");
    box.className="team-setup";

    const title=document.createElement("h2");
    title.textContent="チーム数を選択";
    box.appendChild(title);

    const input=document.createElement("input");
    input.type="number";
    input.min=2;
    input.value=teamCount;
    box.appendChild(input);

    const btn=document.createElement("button");
    btn.textContent="決定";
    btn.onclick=()=>{
        teamCount=parseInt(input.value);
        onSubmit();
    };
    box.appendChild(btn);

    container.appendChild(box);
}

// =========================
// ランキング受信
// =========================
export function receiveRanking(data){
    lastRanking = data;
    showRanking(container, data, true);
}

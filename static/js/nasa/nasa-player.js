import { createRankingUI, showCorrect, showScore } from "./nasa-ui.js";

let socket;
let container;
let items = [];
let correct = [];
let personal = [];
let team = [];

export function startNASAPlayer(ws, uiContainer) {
  socket = ws;
  container = uiContainer;

  socket.addEventListener("message", (e) => {
    let data;
    try { data = JSON.parse(e.data); } catch { return; }

    if (data.type === "nasa_start") {
      items = data.items;
      correct = data.correct;
      startPersonal();
    }

    if (data.type === "nasa_show_correct") {
      showCorrect(container, items, correct);
    }
  });
}

function startPersonal() {
  createRankingUI(container, items, (r) => {
    personal = r;

    socket.send(JSON.stringify({
      type: "nasa_personal",
      ranks: r
    }));

    startTeam();
  });
}

function startTeam() {
  createRankingUI(container, items, (r) => {
    team = r;

    socket.send(JSON.stringify({
      type: "nasa_team",
      ranks: r
    }));

    showResult();
  });
}

function calcScore(answer) {
  let score = 0;
  for (let i = 0; i < answer.length; i++) {
    score += Math.abs(answer[i] - correct[i]);
  }
  return score;
}

function showResult() {
  const p = calcScore(personal);
  const t = calcScore(team);
  showScore(container, p, t);
}

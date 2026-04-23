// =========================
// UI生成のみ
// =========================
export function createQuestionUI(container, question, choices, sendAnswer){

  container.innerHTML = `
  <div class="quiz-ui">
    <h2>${question}</h2>

    <div class="quiz-buttons"></div>

    <div id="send-status">✔ 送信しました</div>

    <div id="quiz-graph"></div>
    <div id="quiz-score"></div>
  </div>
  `;

  const btnArea = container.querySelector(".quiz-buttons");

  choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.className = "quiz-choice-btn";
    btn.textContent = c;

    btn.onclick = () => sendAnswer(i);

    btnArea.appendChild(btn);
  });
}

// =========================
// グラフ（表示だけ）
// =========================
export function updateGraph(votes, choices){
  const graph = document.getElementById("quiz-graph");
  if(!graph) return;

  graph.innerHTML = "";

  votes.forEach((v,i)=>{
    const row = document.createElement("div");

    row.innerHTML = `
      <div class="vote-row">
        ${choices[i]} (${v}人)
        <div class="vote-bar" style="width:${v*30}px"></div>
      </div>
    `;

    graph.appendChild(row);
  });
}

// =========================
// スコア表示
// =========================
export function updateScore(scores){
  const container = document.getElementById("quiz-score");
  if(!container) return;

  container.innerHTML = Object.entries(scores)
    .map(([name,score])=>{
      const isMe = name === window.myName;
      return `<div class="${isMe ? "my-score" : ""}">${name}: ${score}点</div>`;
    })
    .join("");
}

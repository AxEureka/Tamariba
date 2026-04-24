// =========================
// UI生成のみ
// =========================
export function createQuestionUI(container, question, choices, sendAnswer){

  container.innerHTML = `
  <div class="quiz-ui">
    <h2>${question}</h2>

    <div class="quiz-buttons"></div>

    <div id="send-status"></div>

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
    row.className = "vote-row";

    const label = document.createElement("div");
    label.textContent = `${choices[i]} (${v}人)`;

    const bar = document.createElement("div");
    bar.className = "vote-bar";
    const max = Math.max(...votes, 1);
    bar.style.width = `${(v / max) * 100}%`;

    row.appendChild(label);
    row.appendChild(bar);

    graph.appendChild(row);
  });
}

// =========================
// スコア表示
// =========================
export function updateScore(scores){
  const scoreBox = document.getElementById("quiz-score");
  if(!scoreBox) return;

  scoreBox.replaceChildren(
    ...Object.entries(scores).map(([name,score])=>{
      const div = document.createElement("div");

      div.textContent = `${name}: ${score}点`;
      div.className = name === window.myName ? "my-score" : "";

      return div;
    })
  );
}

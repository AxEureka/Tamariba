// =========================
// UI生成
// =========================
export function createQuestionUI(container, question, choices, sendAnswer){
  container.innerHTML = `
    <div class="quiz-ui">
      <h2>${question}</h2>
      <div class="quiz-buttons"></div>
      <div id="quiz-graph"></div>
      <div id="quiz-score"></div>
    </div>
  `;

  const btnArea = container.querySelector(".quiz-buttons");

  choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;

    btn.onclick = ()=>{
      sendAnswer(i);
      lockAnswers();
      btn.classList.add("selected-answer");
    };

    btnArea.appendChild(btn);
  });
}

// =========================
// 回答ロック（重要）
// =========================
export function lockAnswers(){
  document.querySelectorAll(".quiz-buttons button")
    .forEach(b=>b.disabled = true);
}

// =========================
// グラフ
// =========================
export function updateGraph(votes, choices){
  const graph = document.getElementById("quiz-graph");
  if(!graph) return;

  graph.innerHTML = "";

  votes.forEach((v,i)=>{
    const row = document.createElement("div");

    row.innerHTML = `
      ${choices[i]} 
      <div style="display:inline-block;height:20px;background:#69f;width:${v*40}px"></div>
      ${v}
    `;

    graph.appendChild(row);
  });
}

// =========================
// 正解表示
// =========================
export function showCorrectAnswer(index){
  const graph = document.getElementById("quiz-graph");
  if(!graph) return;

  if(graph.children[index]){
    graph.children[index].style.background = "yellow";
  }
}

// =========================
// スコア表示
// =========================
export function updateScore(scores){
  const container = document.getElementById("quiz-score");
  if(!container) return;

  container.innerHTML = Object.entries(scores)
    .map(([name,score])=>{
      if(name === window.myName){
        return `<div style="color:yellow">${name}: ${score}点</div>`;
      }
      return `<div>${name}: ${score}点</div>`;
    })
    .join("");
}

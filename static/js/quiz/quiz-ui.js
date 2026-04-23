// =========================
// UI生成
// =========================
export function createQuestionUI(container, question, choices, sendAnswer){
  container.innerHTML = `
  <div class="quiz-ui">
    <h2>${question}</h2>
    <div class="quiz-buttons"></div>

    <div id="send-status" style="
      text-align:center;
      margin-top:10px;
      color:#0f0;
      font-weight:bold;
      display:none;
    ">
      ✔ 送信しました
    </div>

    <div id="quiz-graph"></div>
    <div id="quiz-score"></div>
  </div>
`;

  const btnArea = container.querySelector(".quiz-buttons");

  choices.forEach((c,i)=>{
    const btn = document.createElement("button");
    btn.textContent = c;
  
    btn.classList.add("quiz-choice-btn"); // ← ★これ追加（超重要）
  
    btn.onclick = ()=>{
      sendAnswer(i);

      document.getElementById("send-status").style.display = "block";
  
      // ★全ボタンロック＋見た目変更
      document.querySelectorAll(".quiz-choice-btn").forEach((b, index)=>{
        b.disabled = true;
  
        if(index === i){
          b.style.background = "#ffcc00";
          b.style.color = "#000";
          b.style.fontWeight = "bold";
        }else{
          b.style.opacity = "0.5";
        }
      });
    };
  
    btnArea.appendChild(btn);
  });
}

// =========================
// 回答ロック（重要）
// =========================
export function lockAnswers(){
  document.querySelectorAll(".quiz-choice-btn")
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
      <div style="margin:8px 0">
        ${choices[i]} (${v}人)
        <div style="
          height:20px;
          background:#69f;
          width:${v*30}px;
          transition:0.3s;
        "></div>
      </div>
    `;

    graph.appendChild(row);
  });
}

// =========================
// 正解表示
// =========================
export function showCorrectAnswer(index){
  const buttons = document.querySelectorAll(".quiz-choice-btn");

  buttons.forEach((btn, i)=>{
    if(i === index){
      btn.style.background = "#4CAF50"; // 緑
      btn.style.color = "#fff";
      btn.style.fontWeight = "bold";
    }
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
      if(name === window.myName){
        return `<div style="color:yellow">${name}: ${score}点</div>`;
      }
      return `<div>${name}: ${score}点</div>`;
    })
    .join("");
}

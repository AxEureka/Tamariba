let timerInterval=null;

// UI生成
export function createQuestionUI(container, question, choices, sendAnswer){
  container.innerHTML="";

  const wrap=document.createElement("div");

  wrap.innerHTML=`
    <h2>${question}</h2>
    <div id="quiz-timer"></div>
    <div id="quiz-buttons"></div>
    <div id="quiz-graph"></div>
    <div id="score-display"></div>
  `;

  const btnArea = wrap.querySelector("#quiz-buttons");

  choices.forEach((c,i)=>{
    const btn=document.createElement("button");
    btn.textContent=c;
    btn.onclick=()=>{
      sendAnswer(i);
      btnArea.querySelectorAll("button").forEach(b=>b.disabled=true);
      btn.classList.add("selected-answer");
    };
    btnArea.appendChild(btn);
  });

  container.appendChild(wrap);
}

// タイマー
export function startTimer(sec){
  const el=document.getElementById("quiz-timer");
  let t=sec;
  el.textContent=`残り ${t}`;

  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    t--;
    el.textContent=`残り ${t}`;
    if(t<=0){
      clearInterval(timerInterval);
      el.textContent="締切";
      lockAnswers();

      if(window.socket){
        window.socket.send(JSON.stringify({type:"quiz_timer_end"}));
      }
    }
  },1000);
}

// ロック
export function lockAnswers(){
  document.querySelectorAll("button").forEach(b=>b.disabled=true);
}

// グラフ
export function updateGraph(votes,choices){
  const graph=document.getElementById("quiz-graph");
  graph.innerHTML="";

  votes.forEach((v,i)=>{
    graph.innerHTML+=`
      <div>${choices[i]} 
        <div style="background:#4caf50;height:10px;width:${v*40}px"></div>
        ${v}
      </div>
    `;
  });
}

// 正解
export function showCorrectAnswer(i){
  const rows=document.getElementById("quiz-graph").children;
  if(rows[i]) rows[i].style.background="yellow";
}

// スコア表示
export function updateScore(scores){
  const box=document.getElementById("score-display");
  if(!box) return;

  let html="<h3>スコア</h3>";
  for(const name in scores){
    html+=`${name}: ${scores[name]}<br>`;
  }
  box.innerHTML=html;
}

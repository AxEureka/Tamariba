let timerInterval = null;

// =========================
// クイズUI表示
// =========================
export function createQuestionUI(container, question, choices, sendAnswer){

  if (!container) return;
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "quiz-ui";

  // 問題文
  const q = document.createElement("h2");
  q.textContent = question || "";
  wrapper.appendChild(q);

  // タイマーUI
  const timer = document.createElement("div");
  timer.id = "quiz-timer";
  timer.style.margin = "10px 0";
  wrapper.appendChild(timer);

  // ボタンエリア
  const btnArea = document.createElement("div");
  btnArea.className = "quiz-buttons";

  if (Array.isArray(choices)){
    choices.forEach((choice,i)=>{
      const btn = document.createElement("button");
      btn.textContent = String(choice ?? "");
      btn.onclick = ()=>{

  if(sendAnswer) sendAnswer(i);

  btnArea.querySelectorAll("button").forEach(b=>{
    b.disabled = true;
  });

  // ★選んだボタンを記録
  btn.classList.add("selected-answer");

};
      btnArea.appendChild(btn);
    });
  }

  wrapper.appendChild(btnArea);

  // 投票グラフ
  const graph = document.createElement("div");
  graph.id = "quiz-graph";
  graph.style.marginTop = "20px";
  wrapper.appendChild(graph);

  // 戻るボタン
  const backBtn = document.createElement("button");
  backBtn.textContent = "ルームに戻る";
  backBtn.style.marginTop = "20px";
  backBtn.onclick = ()=>{
    closeQuizUI(container);
  };
  wrapper.appendChild(backBtn);

  // UI表示
  container.appendChild(wrapper);
  container.classList.add("active");
}

// =========================
// タイマー
// =========================
export function startTimer(seconds,onFinish){
  const timer = document.getElementById("quiz-timer");
  if(!timer) return;

  clearInterval(timerInterval);
  let time = seconds;
  timer.textContent = `残り ${time} 秒`;

  timerInterval = setInterval(()=>{
    time--;
    timer.textContent = `残り ${time} 秒`;

    if(time<=0){
      clearInterval(timerInterval);
      timer.textContent = "回答締切";
      lockAnswers();
      if(onFinish) onFinish();
    }
  },1000);
}

// =========================
// 回答ロック
// =========================
export function lockAnswers(){
  document.querySelectorAll(".quiz-buttons button")
    .forEach(b=>{b.disabled=true;});
}

// =========================
// グラフ更新
// =========================
export function updateGraph(votes,choices){
  const graph = document.getElementById("quiz-graph");
  if(!graph) return;
  graph.innerHTML="";
  if(!Array.isArray(votes)){
    const arr=[0,0,0,0];
    Object.values(votes).forEach(v=>{
      if(arr[v]!==undefined) arr[v]++;
    });
    votes=arr;
  }
  votes.forEach((v,i)=>{
    const row=document.createElement("div");
    row.style.marginBottom="6px";
    const label=document.createElement("span");
    label.textContent=(choices && choices[i] ? choices[i] : "")+" ";
    const bar=document.createElement("div");
    bar.className="vote-bar";
    bar.style.width=(v*40)+"px";
    const count=document.createElement("span");
    count.textContent=v ?? 0;
    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(count);
    graph.appendChild(row);
  });
}

// =========================
// 正解表示
// =========================
export function showCorrectAnswer(answerIndex){
  const graph=document.getElementById("quiz-graph");
  if(!graph) return;
  const rows=graph.children;
  if(!rows || !rows[answerIndex]) return;
  rows[answerIndex].classList.add("correct-bar");
}

// =========================
// クイズUI閉じる
// =========================
export function closeQuizUI(container){
  if(!container) return;
  clearInterval(timerInterval);
  container.innerHTML="";
  container.classList.remove("active");
}

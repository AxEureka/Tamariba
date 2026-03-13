// quiz-ui.js（完全版、既存ロジック変更なし、タイマー追加済み）

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

  // =========================
  // タイマーON/OFFと秒数選択UI
  // =========================
  const timerWrapper = document.createElement("div");
  timerWrapper.style.marginBottom = "12px";

  const timerLabel = document.createElement("label");
  const timerCheckbox = document.createElement("input");
  timerCheckbox.type = "checkbox";
  timerCheckbox.id = "useTimer";
  timerLabel.appendChild(timerCheckbox);
  timerLabel.appendChild(document.createTextNode(" タイマー"));
  timerWrapper.appendChild(timerLabel);

  const timerSelect = document.createElement("select");
  timerSelect.id = "timerSeconds";
  [5,10,20,30].forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s + "秒";
    if(s===10) opt.selected = true;
    timerSelect.appendChild(opt);
  });
  timerWrapper.appendChild(timerSelect);

  wrapper.appendChild(timerWrapper);

  // =========================
  // ボタンエリア
  // =========================
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
      };
      btnArea.appendChild(btn);
    });
  }

  wrapper.appendChild(btnArea);

  // =========================
  // 投票グラフ
  // =========================
  const graph = document.createElement("div");
  graph.id = "quiz-graph";
  graph.style.marginTop = "20px";
  wrapper.appendChild(graph);

  // =========================
  // 出題ボタン（タイマー情報も送信）
  // =========================
  const sendBtn = document.createElement("button");
  sendBtn.textContent = "出題";
  sendBtn.style.marginTop = "12px";
  sendBtn.onclick = ()=>{
    const useTimer = document.getElementById("useTimer").checked;
    const seconds = parseInt(document.getElementById("timerSeconds").value);

    if(typeof socket !== "undefined" && socket.readyState === WebSocket.OPEN){
      socket.send(JSON.stringify({
        type:"quiz_question",
        question:question,
        choices:choices,
        timer: useTimer ? seconds : 0
      }));
    }
  };
  wrapper.appendChild(sendBtn);

  // =========================
  // 戻るボタン
  // =========================
  const backBtn = document.createElement("button");
  backBtn.textContent = "ルームに戻る";
  backBtn.style.marginTop = "20px";
  backBtn.onclick = ()=>{
    closeQuizUI(container);
  };
  wrapper.appendChild(backBtn);

  // =========================
  // UI表示
  // =========================
  container.appendChild(wrapper);
  container.classList.add("active");
}

// =========================
// タイマー開始
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
function lockAnswers(){
  document.querySelectorAll(".quiz-buttons button").forEach(b=>{
    b.disabled = true;
  });
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

import {
  createQuestionUI,
  updateGraph,
  showCorrectAnswer,
  startTimer,
  lockAnswers,
  updateScore
} from "./quiz-ui.js";

let socket;
let container;
let choices = [];
let latestVotes = null;
let graphVisible = false;
let answered = false;

export function startQuizPlayer(ws, uiContainer){
  socket = ws;
  window.socket = ws; // ★重要
  container = uiContainer;

  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}

    if(data.type === "quiz_question"){
      choices = data.choices;
      answered = false;
      graphVisible = false;
      latestVotes = null; // ←追加

      createQuestionUI(container, data.question, data.choices, sendAnswer);

      if(data.timer>0){
        startTimer(data.timer);
      }
    }

   if(data.type === "quiz_votes"){
      latestVotes = data.votes;
      updateGraph(latestVotes, choices); // ← 常に更新
    }

    if(data.type === "quiz_show_graph"){
      graphVisible = true;
      updateGraph(data.votes, choices);
    }

    if(data.type === "quiz_correct"){
      showCorrectAnswer(data.correct);
    }

    if(data.type === "quiz_score_update"){
      updateScore(data.scores);
    }

   if(data.type === "quiz_timer_end"){
    lockAnswers();
  
    const timer = document.getElementById("quiz-timer");
    if(timer){
      timer.textContent = "回答締切";
    }
  }
  };
}

function sendAnswer(index){
  if(answered) return;
  answered = true;

  socket.send(JSON.stringify({
    type:"quiz_answer",
    name: window.myName,
    choice:index
  }));

  lockAnswers();
}

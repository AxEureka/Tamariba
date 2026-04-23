import {
  createQuestionUI,
  updateGraph,
  showCorrectAnswer,
  lockAnswers,
  updateScore
} from "./quiz-ui.js";

let socket;
let choices = [];
let answered = false;

export function startQuizPlayer(ws, container){
  socket = ws;
  window.socket = ws;

  socket.onmessage = (e)=>{
    let data;
    try{ data = JSON.parse(e.data); }catch{return;}

    if(data.type === "quiz_question"){
      choices = data.choices;
      answered = false;

      createQuestionUI(container, data.question, data.choices, sendAnswer);
    }

    if(data.type === "quiz_votes"){
      // 無視（親のみ表示）
    }

    if(data.type === "quiz_show_graph"){
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

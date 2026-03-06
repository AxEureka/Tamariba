let socket;
let votes = [0,0,0,0];
let correctAnswer = 0;
let players = {};

// ここを startQuizHost に変更
export function startQuizHost(ws, container) {
  socket = ws;

  socket.addEventListener("message", e => {
    const data = JSON.parse(e.data);

    if (data.type === "quiz_answer") {
      const a = data.answer;
      if (a === undefined) return;
      votes[a]++;
      broadcastVotes();
    }
  });

  // container は必要なら使う
}

export function sendQuestion(question, choices, answer) {
  votes = [0,0,0,0];
  correctAnswer = answer;

  socket.send(JSON.stringify({
    type: "quiz_question",
    question: question,
    choices: choices
  }));
}

export function revealAnswer() {
  socket.send(JSON.stringify({
    type: "quiz_correct",
    answer: correctAnswer
  }));
}

function broadcastVotes() {
  socket.send(JSON.stringify({
    type: "quiz_votes",
    votes: votes
  }));
}

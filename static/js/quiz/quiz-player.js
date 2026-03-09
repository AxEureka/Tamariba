// quiz-player.js

import {
createQuestionUI,
updateGraph,
showCorrectAnswer
} from "./quiz-ui.js";

let container;
let socket;
let choices = [];

// ★ init → start に変更しただけ
export function startQuizPlayer(ws, uiContainer) {

socket = ws;
container = uiContainer;

socket.onmessage = e => {

```
const data = JSON.parse(e.data);

if (data.type === "quiz_question") {

  choices = data.choices;

  createQuestionUI(
    container,
    data.question,
    choices,
    sendAnswer
  );

}

if (data.type === "quiz_votes") {

  updateGraph(data.votes, choices);

}

if (data.type === "quiz_correct") {

  showCorrectAnswer(data.answer);

}
```

};

}

function sendAnswer(index) {

socket.send(JSON.stringify({
type: "quiz_answer",
answer: index
}));

}

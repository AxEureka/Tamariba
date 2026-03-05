// quiz-player.js
import { createQuestionUI, showCorrectAnswer } from "./quiz-ui.js";

export function startQuizPlayer(socket, container) {

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if(data.type === "new_question") {
      createQuestionUI(container, data.question, data.choices, (choiceIndex)=>{
        socket.send(JSON.stringify({
          type: "answer",
          choice: choiceIndex
        }));
      });
    }

    if(data.type === "show_answer") {
      showCorrectAnswer(container, data.correct, ["A","B","C","D"]);
    }
  };
}

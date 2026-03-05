import { createQuestionUI, showCorrectAnswer } from "./quiz-ui.js";

export function startQuizPlayer(socket, container) {

  socket.addEventListener("message", (event) => {

    const data = JSON.parse(event.data);

    // 問題表示
    if(data.type === "new_question") {

      createQuestionUI(
        container,
        data.question,
        data.choices,
        (choiceIndex)=>{

          socket.send(JSON.stringify({
            type: "answer",
            choice: choiceIndex
          }));

        }
      );

    }

    // 正解発表
    if(data.type === "show_answer") {

      showCorrectAnswer(
        container,
        data.correct
      );

    }

  });

}

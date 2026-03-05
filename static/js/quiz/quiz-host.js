import { createQuestionUI, showResultGraph, showCorrectAnswer } from "./quiz-ui.js";

let votes = [0,0,0,0];
let currentAnswer = null;

export function startQuizHost(socket, container) {

  const modal = document.createElement("div");
  modal.innerHTML = `
    <h3>問題作成</h3>

    <input id="q-text" placeholder="問題文"><br>

    <input id="c0" placeholder="選択肢 A"><br>
    <input id="c1" placeholder="選択肢 B"><br>
    <input id="c2" placeholder="選択肢 C"><br>
    <input id="c3" placeholder="選択肢 D"><br>

    正解:
    <select id="correct">
      <option value="0">A</option>
      <option value="1">B</option>
      <option value="2">C</option>
      <option value="3">D</option>
    </select>

    <br><br>

    <button id="send-question">送信</button>

    <h3>回答結果</h3>
    <div id="host-results"></div>

    <br>

    <button id="reveal-answer">正解発表</button>
  `;

  container.innerHTML = "";
  container.appendChild(modal);

  // 問題送信
  document.getElementById("send-question").onclick = () => {

    const q = document.getElementById("q-text").value;

    const choices = [
      document.getElementById("c0").value,
      document.getElementById("c1").value,
      document.getElementById("c2").value,
      document.getElementById("c3").value
    ];

    const correct = parseInt(document.getElementById("correct").value);

    votes = [0,0,0,0];
    currentAnswer = correct;

    socket.send(JSON.stringify({
      type: "new_question",
      question: q,
      choices
    }));

  };

  // 正解発表
  document.getElementById("reveal-answer").onclick = () => {

    showCorrectAnswer(
      document.getElementById("host-results"),
      votes,
      currentAnswer
    );
    socket.send(JSON.stringify({
      type: "show_answer",
      correct: currentAnswer
    }));

  };

  // WebSocket受信
  socket.addEventListener("message", (event) => {

    const data = JSON.parse(event.data);

    if(data.type === "vote_update") {

      const answers = data.answers;

      votes = [0,0,0,0];

      for(const name in answers){
        votes[answers[name]]++;
      }
      
      showResultGraph(
        document.getElementById("host-results"),
        votes,
        ["A","B","C","D"]
      );

    }

  });

}

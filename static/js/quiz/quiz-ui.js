// quiz-ui.js

export function createQuestionUI(container, question, choices, onAnswer) {

  container.innerHTML = "";

  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.background = "white";
  modal.style.color = "black";
  modal.style.padding = "30px";
  modal.style.borderRadius = "12px";
  modal.style.textAlign = "center";
  modal.style.minWidth = "320px";
  modal.id = "quiz-modal";

  const title = document.createElement("h2");
  title.textContent = question;
  modal.appendChild(title);

  choices.forEach((c, i) => {

    const btn = document.createElement("button");
    btn.textContent = `${String.fromCharCode(65+i)}: ${c}`;
    btn.style.display = "block";
    btn.style.margin = "10px auto";
    btn.style.padding = "10px 20px";

    btn.onclick = () => {

      const buttons = modal.querySelectorAll("button");
      buttons.forEach(b => b.disabled = true);

      onAnswer(i);
    };

    modal.appendChild(btn);
  });

  const result = document.createElement("div");
  result.id = "quiz-result";
  result.style.marginTop = "20px";

  modal.appendChild(result);

  container.appendChild(modal);
}

export function updateGraph(votes, choices) {

  const result = document.getElementById("quiz-result");
  if (!result) return;

  result.innerHTML = "<h4>投票状況</h4>";

  const max = Math.max(...votes, 1);

  choices.forEach((c, i) => {

    const count = votes[i] || 0;

    const row = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = `${String.fromCharCode(65+i)}: ${c} (${count})`;

    const bar = document.createElement("div");
    bar.style.height = "14px";
    bar.style.width = (count / max * 200) + "px";
    bar.style.background = "skyblue";
    bar.style.margin = "4px auto";

    row.appendChild(label);
    row.appendChild(bar);

    result.appendChild(row);
  });

}

export function showCorrectAnswer(answerIndex) {

  const result = document.getElementById("quiz-result");
  if (!result) return;

  const msg = document.createElement("h3");
  msg.style.color = "red";
  msg.textContent =
    `正解は ${String.fromCharCode(65+answerIndex)} です！`;

  result.appendChild(msg);

}

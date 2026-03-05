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
  modal.style.minWidth = "300px";

  const title = document.createElement("h2");
  title.textContent = question;
  modal.appendChild(title);

  choices.forEach((c, i) => {

    const btn = document.createElement("button");
    btn.textContent = `${String.fromCharCode(65+i)}: ${c}`;
    btn.style.display = "block";
    btn.style.margin = "8px auto";
    btn.style.padding = "10px 20px";

    btn.onclick = () => onAnswer(i);

    modal.appendChild(btn);

  });

  container.appendChild(modal);
}
export function showResultGraph(container, votes, choices) {
  container.innerHTML = `<h4>集計結果</h4>`;
  choices.forEach((c, i) => {
    const count = votes[i] || 0;
    const bar = document.createElement("div");
    bar.style.width = count * 50 + "px";
    bar.style.background = "skyblue";
    bar.style.margin = "2px";
    bar.textContent = `${String.fromCharCode(65+i)}: ${c} (${count})`;
    container.appendChild(bar);
  });
}

export function showCorrectAnswer(container, answerIndex) {
  container.innerHTML =
    `<h3>正解は ${String.fromCharCode(65+answerIndex)} です！</h3>`;
}

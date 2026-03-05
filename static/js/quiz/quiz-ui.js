// quiz-ui.js
export function createQuestionUI(container, question, choices, onAnswer) {
  container.innerHTML = `<h3>${question}</h3>`;
  choices.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${String.fromCharCode(65+i)}: ${c}`;
    btn.onclick = () => onAnswer(i);
    container.appendChild(btn);
  });
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

export function showCorrectAnswer(container, answerIndex, choices) {
  container.innerHTML = `<h4>正解: ${String.fromCharCode(65+answerIndex)} - ${choices[answerIndex]}</h4>`;
}

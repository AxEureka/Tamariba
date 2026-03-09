// quiz-ui.js

export function createQuestionUI(container, question, choices, sendAnswer) {

  container.innerHTML = "";

  const q = document.createElement("h2");
  q.textContent = question;
  container.appendChild(q);

  const btnArea = document.createElement("div");
  btnArea.className = "quiz-buttons";

  choices.forEach((choice, i) => {

    const btn = document.createElement("button");
    btn.textContent = choice;

    btn.onclick = () => {
      sendAnswer(i);
      btnArea.querySelectorAll("button").forEach(b => b.disabled = true);
    };

    btnArea.appendChild(btn);

  });

  container.appendChild(btnArea);

  const graph = document.createElement("div");
  graph.id = "quiz-graph";
  container.appendChild(graph);

}

export function updateGraph(votes, choices) {

  const graph = document.getElementById("quiz-graph");
  if (!graph) return;

  graph.innerHTML = "";

  votes.forEach((v, i) => {

    const row = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = choices[i] + " ";

    const bar = document.createElement("div");
    bar.style.display = "inline-block";
    bar.style.height = "20px";
    bar.style.background = "#4CAF50";
    bar.style.width = (v * 40) + "px";

    const count = document.createElement("span");
    count.textContent = " " + v;

    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(count);

    graph.appendChild(row);

  });

}

export function showCorrectAnswer(answerIndex) {

  const graph = document.getElementById("quiz-graph");
  if (!graph) return;

  const rows = graph.children;

  if (rows[answerIndex]) {
    rows[answerIndex].style.background = "#fff3a0";
  }

}

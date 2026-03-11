// quiz-ui.js

export function createQuestionUI(container, question, choices, sendAnswer) {

if (!container) return;

container.innerHTML = "";

const wrapper = document.createElement("div");
wrapper.className = "quiz-ui";

// 問題文
const q = document.createElement("h2");
q.textContent = question || "";
wrapper.appendChild(q);

// ボタンエリア
const btnArea = document.createElement("div");
btnArea.className = "quiz-buttons";

if (Array.isArray(choices)) {

choices.forEach((choice, i) => {

const btn = document.createElement("button");

btn.textContent = String(choice ?? "");

btn.onclick = () => {

sendAnswer?.(i);

btnArea.querySelectorAll("button").forEach(b=>{
b.disabled = true;
});

};

btnArea.appendChild(btn);

});

}

wrapper.appendChild(btnArea);

// 投票グラフ
const graph = document.createElement("div");
graph.id = "quiz-graph";
graph.style.marginTop = "20px";

wrapper.appendChild(graph);

container.appendChild(wrapper);

}

export function updateGraph(votes, choices) {

const graph = document.getElementById("quiz-graph");
if (!graph) return;

graph.innerHTML = "";

// サーバー形式 → 配列に変換
if (!Array.isArray(votes)) {

const arr = [0,0,0,0];

Object.values(votes).forEach(v=>{
if(arr[v] !== undefined) arr[v]++;
});

votes = arr;

}

votes.forEach((v, i) => {

const row = document.createElement("div");
row.style.marginBottom = "6px";

const label = document.createElement("span");
label.textContent = (choices && choices[i] ? choices[i] : "") + " ";

const bar = document.createElement("div");
bar.style.display = "inline-block";
bar.style.height = "20px";
bar.style.background = "#4CAF50";
bar.style.width = (v * 40) + "px";
bar.style.margin = "0 6px";

const count = document.createElement("span");
count.textContent = v ?? 0;

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

if (!rows || !rows[answerIndex]) return;

rows[answerIndex].classList.add("correct-bar");
}



function startTestQuiz() {

  fetch(`/room/${roomId}/quiz/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: myName,
      question: "日本の首都は？",
      choices: ["東京", "大阪", "京都", "福岡"]
    })
  });

}

// NASA UI 作成
export function createItemEditor(container, onSubmit) {
  container.innerHTML = "";

  const box = document.createElement("div");
  box.className = "nasa-ui";

  const title = document.createElement("h2");
  title.textContent = "品目設定";
  box.appendChild(title);

  const countInput = document.createElement("input");
  countInput.type = "number";
  countInput.value = 5;
  countInput.min = 2;
  countInput.max = 20;
  box.appendChild(document.createTextNode("品目数: "));
  box.appendChild(countInput);

  const itemArea = document.createElement("div");
  box.appendChild(itemArea);

  function buildItems() {
    itemArea.innerHTML = "";
    const n = parseInt(countInput.value);

    for (let i = 0; i < n; i++) {
      const row = document.createElement("div");
      row.style.marginBottom = "6px";

      const name = document.createElement("input");
      name.placeholder = "品目" + (i + 1);
      name.style.marginRight = "6px";

      const rank = document.createElement("input");
      rank.type = "number";
      rank.placeholder = "正解順位";

      row.appendChild(name);
      row.appendChild(rank);
      itemArea.appendChild(row);
    }
  }

  countInput.onchange = buildItems;
  buildItems();

  const btn = document.createElement("button");
  btn.textContent = "出題";
  btn.style.marginTop = "12px";

  btn.onclick = () => {
    const items = [];
    const correct = [];

    itemArea.querySelectorAll("div").forEach(row => {
      const inputs = row.querySelectorAll("input");
      const nameVal = inputs[0].value.trim();
      const rankVal = parseInt(inputs[1].value);

      if (!nameVal || isNaN(rankVal)) {
        alert("全ての品目と正解順位を入力してください");
        return;
      }

      items.push(nameVal);
      correct.push(rankVal);
    });

    if (items.length === parseInt(countInput.value)) {
      onSubmit(items, correct);
    }
  };

  box.appendChild(btn);
  container.appendChild(box);
}

// 子画面のランキング UI
export function createRankingUI(container, items, onSubmit) {
  container.innerHTML = "";

  const box = document.createElement("div");
  box.className = "nasa-ui";

  const selects = [];

  items.forEach(item => {
    const row = document.createElement("div");
    row.style.marginBottom = "8px";

    const label = document.createElement("span");
    label.textContent = item + " ";

    const select = document.createElement("select");
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "選択";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    for (let i = 1; i <= items.length; i++) {
      const op = document.createElement("option");
      op.value = i;
      op.textContent = i;
      select.appendChild(op);
    }

    row.appendChild(label);
    row.appendChild(select);
    box.appendChild(row);
    selects.push(select);
  });

  const btn = document.createElement("button");
  btn.textContent = "OK";
  btn.style.marginTop = "12px";

  btn.onclick = () => {
    if (selects.some(s => !s.value)) {
      alert("全ての品目の順位を選択してください");
      return;
    }

    const ranks = selects.map(s => parseInt(s.value));
    onSubmit(ranks);

    // OK後は無効化
    selects.forEach(s => s.disabled = true);
    btn.disabled = true;
  };

  box.appendChild(btn);
  container.appendChild(box);
}

// 正解表示
export function showCorrect(container, items, correct) {
  container.innerHTML = "<h2>正解順位</h2>";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.textContent = item + " : " + correct[i];
    container.appendChild(div);
  });
}

// スコア表示
export function showScore(container, pScore, tScore) {
  const diff = pScore - tScore;
  let comment = "";

  if (diff > 20) comment = "チームの知恵がすごい！";
  else if (diff > 5) comment = "チームで改善！";
  else if (diff > -5) comment = "いい議論！";
  else comment = "あなた優秀！";

  container.innerHTML = `
    <h2>結果</h2>
    個人スコア: ${pScore}<br>
    チームスコア: ${tScore}<br>
    差: ${diff}<br><br>
    ${comment}
  `;
}

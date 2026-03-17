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

      const name = document.createElement("input");
      name.placeholder = "品目" + (i + 1);

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
  btn.onclick = () => {
    const items = [];
    const correct = [];
    itemArea.querySelectorAll("div").forEach(row => {
      const inputs = row.querySelectorAll("input");
      items.push(inputs[0].value);
      correct.push(parseInt(inputs[1].value));
    });
    onSubmit(items, correct);
  };

  btn.onclick=()=>{

const ranks=selects.map(s=>parseInt(s.value));

if(ranks.some(v=>!v)){
alert("すべて順位を選んでください");
return;
}

onSubmit(ranks);

};
  
  box.appendChild(btn);
  container.appendChild(box);
}

export function createRankingUI(container,items,onSubmit,title){

container.innerHTML="";

const box=document.createElement("div");
box.className="nasa-ui";

if(title){
const h=document.createElement("h2");
h.textContent=title;
box.appendChild(h);
}

const selects=[];

items.forEach(item=>{

const row=document.createElement("div");

const label=document.createElement("span");
label.textContent=item+" ";

const select=document.createElement("select");

const first=document.createElement("option");
first.value="";
first.textContent="選択";
first.disabled=true;
first.selected=true;
select.appendChild(first);

for(let i=1;i<=items.length;i++){

const op=document.createElement("option");
op.value=i;
op.textContent=i;

select.appendChild(op);

}

row.appendChild(label);
row.appendChild(select);

box.appendChild(row);

selects.push(select);

});

const btn=document.createElement("button");
btn.textContent="OK";

btn.onclick=()=>{

const ranks=selects.map(s=>parseInt(s.value)||0);

onSubmit(ranks);

};

box.appendChild(btn);

container.appendChild(box);

}

export function showCorrect(container, items, correct) {
  container.innerHTML = "<h2>正解順位</h2>";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.textContent = item + " : " + correct[i];
    container.appendChild(div);
  });
}

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

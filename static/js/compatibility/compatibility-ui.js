
// ===============================
// 相性診断回答UI
// ===============================

export function createCompatibilityUI(
    container,
    questions,
    onSubmit
){

    container.innerHTML="";

    const box=document.createElement("div");
    box.className="compatibility-ui";

    const title=document.createElement("h2");
    title.textContent="相性診断";
    box.appendChild(title);


    const answers=[];


    questions.forEach((q,index)=>{

        const div=document.createElement("div");

        const h=document.createElement("h3");
        h.textContent=q.question;

        div.appendChild(h);


        const choiceBox = document.createElement("div");
        choiceBox.className = "compatibility-choices";
        
        let selectedValue = null;
        
        q.choices.forEach((choice) => {
        
            const choiceBtn = document.createElement("button");
        
            choiceBtn.type = "button";
            choiceBtn.className = "compatibility-choice";
            choiceBtn.textContent = choice.text;
        
            choiceBtn.onclick = () => {
        
                selectedValue = choice.id;
        
                choiceBox
                    .querySelectorAll(".compatibility-choice")
                    .forEach(btn => {
                        btn.classList.remove("selected");
                    });
        
                choiceBtn.classList.add("selected");
            };
        
            choiceBox.appendChild(choiceBtn);
        });
        
        div.appendChild(choiceBox);
        box.appendChild(div);
        
        answers.push({
            get value() {
                return selectedValue;
            }
        });


    const btn=document.createElement("button");

    btn.textContent="回答する";


    btn.onclick=()=>{

        const result = answers.map(
            s => s.value
        );
        
        if(result.some(v => v === null)){
            alert("すべての質問に回答してください");
            return;
        }

onSubmit(result);

    };


    box.appendChild(btn);

    container.appendChild(box);

}

export function createRankingUI(
    container,
    question,
    players,
    onSubmit,
    mode="answer"
){

    container.innerHTML="";

    const box=document.createElement("div");
    box.className="ranking-ui";
    
    box.style.position="relative";
    box.style.zIndex="1000";
    box.style.pointerEvents="auto";

    const title=document.createElement("h2");

    title.textContent =
        mode==="answer"
        ? "ランキングを付けてください"
        : "ランキングを予想してください";

    box.appendChild(title);

    const q=document.createElement("h3");
    q.textContent=question.question;
    box.appendChild(q);

    const selects=[];

    const choices =
        question.choices || [];

    const rankCount =
        choices.length;

    for(let i=0;i<rankCount;i++){

        const row =
            document.createElement("div");

        const label =
            document.createElement("span");

        label.textContent =
            `${i+1}位： `;

        const select =
            document.createElement("select");

        choices.forEach(choice=>{

            const option =
                document.createElement("option");

            option.value =
                choice.id;

            option.textContent =
                choice.text;

            select.appendChild(option);

        });

        row.appendChild(label);
        row.appendChild(select);

        box.appendChild(row);

        selects.push(select);
    }

    const btn =
        document.createElement("button");
        console.log("ランキングボタン生成");

    btn.textContent =
        mode==="answer"
        ? "確定"
        : "予想する";

btn.onclick=()=>{

    console.log("ランキングボタンクリック");
    const ranking =
        selects.map(
            s=>Number(s.value)
        );


    if(
        new Set(ranking).size
        !==
        rankCount
    ){
        alert(
            "同じ選択肢を複数順位にできません"
        );
        return;
    }


    if(!confirm("確定しますか？")){
        return;
    }


    console.log(
        "ランキング送信",
        ranking
    );


    onSubmit(ranking);
};
    box.appendChild(btn);

    container.appendChild(box);
}

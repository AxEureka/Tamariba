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

    btn.textContent =
        mode==="answer"
        ? "確定"
        : "予想する";

    btn.onclick=()=>{

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

        onSubmit(ranking);
    };

    box.appendChild(btn);

    container.appendChild(box);
}

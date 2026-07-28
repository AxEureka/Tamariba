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

    questions.forEach((q,index)=>{

        const area=document.createElement("div");

        const h=document.createElement("h3");
        h.textContent=`Q${index+1}. ${q.question}`;

        area.appendChild(h);

        q.choices.forEach((choice,cIndex)=>{

            const label=document.createElement("label");

            const radio=document.createElement("input");

            radio.type="radio";
            radio.name=`q${index}`;
            radio.value=cIndex;

            label.appendChild(radio);
            label.append(" "+choice.text);

            area.appendChild(label);
            area.appendChild(
                document.createElement("br")
            );
        });

        box.appendChild(area);
    });

    const btn=document.createElement("button");

    btn.textContent="回答する";

    btn.onclick=()=>{

        const answers=[];

        for(let i=0;i<questions.length;i++){

            const checked=
                document.querySelector(
                    `input[name="q${i}"]:checked`
                );

            if(!checked){
                alert(
                    `${i+1}問目が未回答です`
                );
                return;
            }

            answers.push(
                parseInt(checked.value)
            );
        }

        onSubmit(answers);
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


    const title=document.createElement("h2");

    if(mode==="answer"){
        title.textContent="ランキングを付けてください";
    }else{
        title.textContent="ランキングを予想してください";
    }

    box.appendChild(title);



    const q=document.createElement("h3");

    q.textContent =
        question.question;

    box.appendChild(q);



    const selects=[];



    // ★7択ランキング
    for(let i=0;i<7;i++){

        const label=document.createElement("label");

        label.textContent =
            `${i+1}位：`;


        const select=document.createElement("select");


        question.choices.forEach(choice=>{

            const option=document.createElement("option");

            option.value=choice.id;
            option.textContent=choice.text;

            select.appendChild(option);

        });


        label.appendChild(select);

        box.appendChild(label);

        box.appendChild(
            document.createElement("br")
        );


        selects.push(select);

    }



    const btn=document.createElement("button");


    if(mode==="answer"){
        btn.textContent="確定";
    }else{
        btn.textContent="予想する";
    }



    btn.onclick=()=>{


        const ranking =
            selects.map(
                s=>parseInt(s.value)
            );


        if(
            new Set(ranking).size!==7
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

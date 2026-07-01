export function createCompatibilityUI(
    container,
    questions,
    onSubmit
){

    container.innerHTML="";

    const box=document.createElement("div");

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
            label.append(" "+choice);

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

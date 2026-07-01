console.log("compatibility-host loaded");

export function startCompatibilityHost(
    socket,
    container
){
    console.log("startCompatibilityHost");

    container.innerHTML="";

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "compatibility-ui";

    const title =
        document.createElement("h2");

    title.textContent =
        "相性診断";

    const count =
        document.createElement("input");

    count.type = "number";
    count.min = 3;
    count.max = 20;
    count.value = 10;

    const start =
        document.createElement("button");

    start.textContent =
        "開始";

    const progress =
        document.createElement("div");

    start.onclick = ()=>{

        socket.send(
            JSON.stringify({
                type:"start_compatibility",
                question_count:
                    parseInt(count.value)
            })
        );
    };

    wrapper.appendChild(title);
    wrapper.appendChild(count);
    wrapper.appendChild(start);
    wrapper.appendChild(progress);

    container.appendChild(wrapper);

    socket.addEventListener(
        "message",
        (event)=>{

            const data =
                JSON.parse(event.data);

            if(
                data.type ===
                "compatibility_progress"
            ){
                progress.textContent =
                    `${data.done}/${data.total} 回答済み`;
            }

            if(
                data.type ===
                "compatibility_all_done"
            ){
                progress.textContent =
                    "全員回答完了";
            }
        }
    );
}

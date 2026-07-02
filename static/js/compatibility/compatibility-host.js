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

    const config =
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
    wrapper.appendChild(config);

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
                data.type===
                "compatibility_all_done"
            ){
            
                progress.textContent =
                    "全員回答完了";
            
                config.innerHTML = "";
            
                const teamSize =
                    document.createElement("input");
            
                teamSize.type="number";
                teamSize.value=4;
                teamSize.min=2;
            
                const high =
                    document.createElement("input");
            
                high.type="number";
                high.min=0;
                high.max=100;
                high.value=100;
                
                low.type="number";
                low.min=0;
                low.max=100;
                low.value=0;            
                const makeBtn =
                    document.createElement("button");
            
                makeBtn.textContent =
                    "チーム作成";
            
                makeBtn.onclick = ()=>{

                    makeBtn.disabled = true;
            
                    socket.send(
                        JSON.stringify({
            
                            type:
                            "compatibility_make_team",
            
                            team_size:
                            parseInt(
                                teamSize.value
                            ),
            
                            high_weight:
                            parseInt(
                                high.value
                            ),
            
                            low_weight:
                            parseInt(
                                low.value
                            )
            
                        })
                    );
                };
            
                config.append(
                    document.createTextNode(
                        "チーム人数"
                    )
                );
            
                config.appendChild(
                    teamSize
                );
            
                config.appendChild(
                    document.createElement("br")
                );
            
                config.append(
                    document.createTextNode(
                        "高類似%"
                    )
                );
            
                config.appendChild(
                    high
                );
            
                config.appendChild(
                    document.createElement("br")
                );
            
                config.append(
                    document.createTextNode(
                        "低類似%"
                    )
                );
            
                config.appendChild(
                    low
                );
            
                config.appendChild(
                    document.createElement("br")
                );
            
                config.appendChild(
                    makeBtn
                );
            }

        if(
            data.type===
            "compatibility_team_created"
        ){
        
            progress.textContent =
                "チーム作成完了";
        
            config.innerHTML="";
        
            Object.entries(
                data.teams
            ).forEach(
        
                ([teamName,team])=>{
        
                    const box=
                        document.createElement("div");
        
                    box.className=
                        "team-box";
        
                    box.innerHTML=`
                        <h3>${teamName}</h3>
                        <div>
                            メンバー:
                            ${team.members.join(", ")}
                        </div>
                        <div>
                            平均一致率:
                            ${team.score}%
                        </div>
                    `;
        
                    config.appendChild(box);
                }
            );
        }
        }
    );
}

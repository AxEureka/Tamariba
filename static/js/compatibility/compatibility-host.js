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

            type:
                "start_compatibility",

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

        // --------------------
        // 回答進捗
        // --------------------

        if(
            data.type ===
            "compatibility_progress"
        ){

            progress.textContent =
                `${data.done}/${data.total} 回答済み`;

        }

        // --------------------
        // 全員回答完了
        // --------------------

        if(
            data.type ===
            "compatibility_all_done"
        ){

            progress.textContent =
                "全員回答完了";

            config.innerHTML="";

            const teamCount =
                document.createElement("input");

            teamCount.type="number";
            teamCount.min=2;
            teamCount.value=4;


            const highCount =
                document.createElement("input");

            highCount.type="number";
            highCount.min=0;
            highCount.value=2;


            const lowCount =
                document.createElement("input");

            lowCount.type="number";
            lowCount.min=0;
            lowCount.value=2;


            const makeBtn =
                document.createElement("button");

            makeBtn.textContent =
                "チーム作成";


            makeBtn.onclick = ()=>{

                socket.send(
                    JSON.stringify({

                        type:
                            "compatibility_make_team",

                        team_count:
                            parseInt(
                                teamCount.value
                            ),

                        high_team_count:
                            parseInt(
                                highCount.value
                            ),

                        low_team_count:
                            parseInt(
                                lowCount.value
                            )

                    })
                );

            };


            config.append(
                document.createTextNode(
                    "総チーム数 "
                )
            );

            config.appendChild(
                teamCount
            );

            config.appendChild(
                document.createElement("br")
            );

            config.append(
                document.createTextNode(
                    "高類似チーム数 "
                )
            );

            config.appendChild(
                highCount
            );

            config.appendChild(
                document.createElement("br")
            );

            config.append(
                document.createTextNode(
                    "低類似チーム数 "
                )
            );

            config.appendChild(
                lowCount
            );

            config.appendChild(
                document.createElement("br")
            );

            config.appendChild(
                makeBtn
            );

        }

        // --------------------
        // チーム作成完了
        // --------------------

        if(
            data.type ===
            "compatibility_team_created"
        ){

            progress.textContent =
                "チーム作成完了";

            config.innerHTML="";

            Object.entries(
                data.teams
            ).forEach(

                ([teamName,team])=>{

                    const box =
                        document.createElement("div");

                    box.className =
                        "team-box";

                    box.innerHTML = `
                        <h3>${teamName}</h3>

                        <div>
                            メンバー:
                            ${team.members.join(", ")}
                        </div>

                        <div>
                            実際の平均一致率:
                            ${team.score}%
                        </div>

                        <div>
                            参加者への表示:
                            ${team.shown_score}%
                        </div>
                    `;

                    config.appendChild(
                        box
                    );

                }
            );

        }

    }
);

}

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


    const progress =
        document.createElement("div");


    const config =
        document.createElement("div");



    wrapper.append(
        title,
        progress,
        config
    );


    container.appendChild(
        wrapper
    );



    // =================================
    // 相性診断開始UI
    // =================================


    const questionCount =
        document.createElement("input");

    questionCount.type="number";
    questionCount.min=3;
    questionCount.max=20;
    questionCount.value=10;



    const startBtn =
        document.createElement("button");


    startBtn.textContent =
        "開始";



    startBtn.onclick = ()=>{


        socket.send(
            JSON.stringify({

                type:
                    "start_compatibility",

                question_count:
                    Number(
                        questionCount.value
                    )

            })
        );

    };



    wrapper.insertBefore(
        questionCount,
        progress
    );


    wrapper.insertBefore(
        startBtn,
        progress
    );





    // =================================
    // チーム作成UI
    // =================================


    function showTeamCreate(){

        config.innerHTML="";


        const teamCount =
            createNumberInput(
                4
            );


        const highCount =
            createNumberInput(
                2
            );


        const lowCount =
            createNumberInput(
                2
            );



        const btn =
            document.createElement("button");


        btn.textContent =
            "チーム作成";



        btn.onclick=()=>{


            socket.send(
                JSON.stringify({

                    type:
                        "compatibility_make_team",


                    team_count:
                        Number(
                            teamCount.value
                        ),


                    high_team_count:
                        Number(
                            highCount.value
                        ),


                    low_team_count:
                        Number(
                            lowCount.value
                        )

                })
            );


        };



        config.append(

            text("総チーム数 "),
            teamCount,
            br(),

            text("高類似チーム数 "),
            highCount,
            br(),

            text("低類似チーム数 "),
            lowCount,
            br(),

            btn

        );

    }


    // =================================
    // チーム表示
    // =================================


    function showTeams(teams){


        config.innerHTML="";



        Object.entries(
            teams
        )
        .forEach(
            ([name,team])=>{


                const box =
                    document.createElement("div");


                box.className =
                    "team-box";



                box.innerHTML=`

                    <h3>
                        ${name}
                    </h3>

                    <div>
                        メンバー:
                        ${team.members.join(", ")}
                    </div>

                    <div>
                        実際の平均一致率:
                        ${team.score}%
                    </div>

                    <div>
                        表示一致率:
                        ${team.shown_score}%
                    </div>

                `;



                config.appendChild(
                    box
                );


            }
        );



        showRankingStart();

    }





    // =================================
    // サンレンタン開始UI
    // =================================


    function showRankingStart(){


        const title =
            document.createElement("h3");


        title.textContent =
            "サンレンタン";



        const count =
            createNumberInput(5);



        count.min=1;
        count.max=20;



        const btn =
            document.createElement("button");


        btn.textContent =
            "出題開始";



        btn.onclick=()=>{


            socket.send(
                JSON.stringify({

                    type:
                        "start_ranking_game",


                    question_count:
                        Number(
                            count.value
                        )

                })
            );


        };



        config.append(

            title,

            text("問題数 "),
            count,

            br(),

            btn

        );


    }

    // =================================
    // WebSocket受信
    // =================================


    socket.addEventListener(
        "message",
        (event)=>{


            const data =
                JSON.parse(
                    event.data
                );



            switch(
                data.type
            ){


                case "compatibility_progress":


                    progress.textContent =
                        `${data.done}/${data.total} 回答済み`;

                    break;



                case "compatibility_all_done":


                    progress.textContent =
                        "全員回答完了";


                    showTeamCreate();


                    break;



                case "compatibility_team_created":


                    progress.textContent =
                        "チーム作成完了";


                    showTeams(
                        data.teams
                    );


                    break;



                // ======================
                // ここからサンレンタン用
                // ======================


                case "ranking_progress":


                    progress.textContent =
                        data.message;


                    break;



                case "ranking_result":


                    console.log(
                        "ランキング結果",
                        data
                    );


                    break;


            }


        }
    );


}





// =================================
// 共通関数
// =================================


function createNumberInput(value){


    const input =
        document.createElement("input");


    input.type="number";

    input.value=value;


    return input;

}



function text(value){


    return document.createTextNode(
        value
    );

}



function br(){


    return document.createElement(
        "br"
    );

}

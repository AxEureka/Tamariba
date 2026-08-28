console.log("compatibility-host loaded");

export function startCompatibilityHost(
    getSocket,
    container
){

    console.log("startCompatibilityHost");

    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "compatibility-ui";

    const title = document.createElement("h2");
    title.textContent = "相性診断";

    const progress = document.createElement("div");
    const config = document.createElement("div");

    wrapper.append(
        title,
        progress,
        config
    );

    container.appendChild(wrapper);

    // =================================
    // 相性診断開始
    // =================================

    const questionCount =
        createNumberInput(10);

    questionCount.min = 3;
    questionCount.max = 20;

    const startBtn =
        document.createElement("button");

    startBtn.textContent = "開始";

    startBtn.onclick = ()=>{

        const socket = getSocket();
    
        socket.send(
            JSON.stringify({
                type:"start_compatibility",
                question_count:Number(
                    questionCount.value
                )
            })
        );
    
        // 相性診断開始後は設定UIを消す
        questionCount.style.display = "none";
        startBtn.style.display = "none";
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

        config.innerHTML = "";
    
        const highCount =
            createNumberInput(2);
    
        const lowCount =
            createNumberInput(2);
    
        const btn =
            document.createElement("button");
    
        btn.textContent =
            "チーム作成";
    
        btn.onclick = ()=>{
    
            const socket = getSocket();
    
            const data = {
    
                type:
                    "compatibility_make_team",
    
                high_team_count:
                    Number(highCount.value),
    
                low_team_count:
                    Number(lowCount.value)
    
            };
    
            console.log(
                "送信データ",
                data
            );
    
            socket.send(
                JSON.stringify(data)
            );
        };
    
        config.append(
    
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

        console.log("showTeams実行");
        config.innerHTML = "";

        Object.entries(teams)
        .forEach(
            ([name, team])=>{

                const box =
                    document.createElement("div");

                box.className =
                    "team-box";

                box.innerHTML = `
                    <h3>${name}</h3>

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

                config.appendChild(box);
            }
        );

        const okBtn =
            document.createElement("button");

        okBtn.textContent = "OK";

        okBtn.onclick = ()=>{
            config.innerHTML = "";
            showRankingStart();
        };

        config.appendChild(okBtn);    
    }

    // =================================
    // ランキング開始
    // =================================

    function showRankingStart(){

        console.log("showRankingStart実行");
        const title =
            document.createElement("h3");

        title.textContent =
            "サンレンタン";

        const count =
            createNumberInput(5);

        count.min = 1;
        count.max = 20;

        const btn =
            document.createElement("button");

        btn.textContent =
            "出題開始";

        btn.onclick = ()=>{

            const socket = getSocket();

            socket.send(
                JSON.stringify({

                    type:
                        "start_ranking_game",

                    question_count:
                        Number(count.value)

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

    return {

        showTeamCreate,
    
        showTeams,
    
        getQuestionCount(){
    
            return Number(
                questionCount.value
            );
    
        },
    
        showPredictionButton(){

            console.log("予測開始ボタン表示");
        
            // 現在のUIを消す
            config.innerHTML = "";
        
            const btn =
                document.createElement("button");
        
            btn.textContent =
                "予測開始";
        
            btn.onclick = ()=>{
        
                const socket =
                    getSocket();
        
                socket.send(
                    JSON.stringify({
                        type: "start_ranking_prediction"
                    })
                );
        
                // 予測開始後はボタンを消す
                config.innerHTML = "";
            };
        
            config.appendChild(btn);
        
        },    
        showResultButton(){

            console.log("結果発表ボタン表示");
        
            config.innerHTML = "";
        
            const btn =
                document.createElement("button");
        
            btn.textContent =
                "結果発表";
        
            btn.style.display = "block";
            btn.style.margin = "20px";
            btn.style.fontSize = "24px";
        
            btn.onclick = ()=>{
        
                console.log("結果発表クリック");
        
                const socket =
                    getSocket();
        
                socket.send(
                    JSON.stringify({
                        type:"ranking_show_result"
                    })
                );
        
                config.innerHTML = "";
        
            };
        
            config.appendChild(btn);
        
        },    
        showFinalResultButton(){
    
            console.log("最終結果ボタン表示");
    
            const btn =
                document.createElement("button");
    
            btn.textContent =
                "最終結果を見る";
    
            btn.style.display = "block";
            btn.style.margin = "20px";
            btn.style.fontSize = "24px";
    
            btn.onclick = ()=>{
    
                console.log(
                    "最終結果ボタンクリック"
                );
    
                const socket =
                    getSocket();
    
                socket.send(
                    JSON.stringify({
                        type:
                            "ranking_final"
                    })
                );
    
                btn.remove();
    
            };
    
            config.appendChild(btn);
    
        },
    
        showNextButton(){
    
            console.log("次の問題ボタン表示");
    
            const btn =
                document.createElement("button");
    
            btn.textContent =
                "次の問題";
    
            btn.onclick = ()=>{
    
                const socket =
                    getSocket();
    
                socket.send(
                    JSON.stringify({
    
                        type:
                            "ranking_next_question"
    
                    })
                );
    
                btn.remove();
    
            };
    
            config.appendChild(btn);
    
        },
    
        setProgress(textValue){
    
            progress.textContent =
                textValue;
    
        }
    
    };
// =================================
// 共通関数
// =================================

function createNumberInput(value){

    const input =
        document.createElement("input");

    input.type = "number";
    input.value = value;

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
}

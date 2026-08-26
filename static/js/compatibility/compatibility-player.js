console.log("compatibility-player loaded");


import {
    createCompatibilityUI,
    createRankingUI
}
from "./compatibility-ui.js";


// =================================
// 相性診断開始
// =================================

export function startCompatibilityPlayer(
    container,
    questions,
    socket
){

    console.log(
        "startCompatibilityPlayer 実行"
    );


    createCompatibilityUI(
        container,
        questions,

        (answers)=>{


            console.log(
                "回答送信:",
                answers
            );


            socket.send(
                JSON.stringify({

                    type:
                    "compatibility_answer",

                    name:
                    window.myName,

                    answers:
                    answers

                })
            );


            container.innerHTML = `

                <h2>
                回答を送信しました
                </h2>

                <p>
                他の参加者を待っています
                </p>

            `;


        }
    );

}



// =================================
// チーム結果表示
// =================================

export function showCompatibilityTeam(
    container,
    teams
){

    console.log(
        "チーム結果表示",
        teams
    );


    const myName =
        window.myName ||
        sessionStorage.getItem(
            "playerName"
        );



    Object.entries(
        teams
    )
    .forEach(

        ([teamName,team])=>{


            if(
                team.members.includes(
                    myName
                )
            ){


                container.innerHTML = `

                    <h2>
                    あなたは
                    ${teamName}
                    です
                    </h2>


                    <div>
                    メンバー:
                    ${team.members.join(", ")}
                    </div>


                    <div>
                    相性:
                    ${team.shown_score}%
                    </div>

                `;


            }

        }
    );

}

export function showRankingQuestion(
    container,
    data,
    socket
){

    const myName =
        window.myName ||
        sessionStorage.getItem(
            "playerName"
        );


    const answerers =
        data.answerers || {};


    const teams =
        data.teams || {};


    // =================================
    // 自分がどのチームに所属しているか探す
    // =================================

    let myTeam = null;

    Object.entries(teams).forEach(
        ([teamName, team]) => {

            if(
                team.members &&
                team.members.includes(myName)
            ){

                myTeam = teamName;

            }

        }
    );


    console.log(
        "今回の自分のチーム:",
        myTeam
    );


    console.log(
        "今回の代表:",
        answerers
    );


    // =================================
    // 自分のチームの代表
    // =================================

    const myAnswerer =
        myTeam
        ? answerers[myTeam]
        : null;


    console.log(
        "自チーム代表:",
        myAnswerer
    );


    // =================================
    // 自分が代表の場合
    // =================================

    if(
        myAnswerer === myName
    ){

        createRankingUI(
            container,

            data.question,

            // ランキング対象
            // 問題データから取得
            data.players || [],

            (ranking)=>{

                socket.send(
                    JSON.stringify({

                        type:
                            "ranking_answer",

                        answer_type:
                            "true",

                        name:
                            myName,

                        ranking:
                            ranking

                    })
                );


                container.innerHTML = `

                    <h2>
                    回答しました
                    </h2>

                    <p>
                    他のメンバーの予想を待っています。
                    </p>

                `;

            }
        );


        return;

    }


    // =================================
    // 自分が代表ではない場合
    // =================================

    if(myAnswerer){

        createRankingUI(
            container,

            data.question,

            // ★重要
            // 自分のチームの代表だけを予想
            [myAnswerer],

            (ranking)=>{

                socket.send(
                    JSON.stringify({

                        type:
                            "ranking_answer",

                        answer_type:
                            "prediction",

                        name:
                            myName,

                        target:
                            myAnswerer,

                        ranking:
                            ranking

                    })
                );


                container.innerHTML = `

                    <h2>
                    予想を送信しました
                    </h2>

                    <p>
                    次の問題を待っています。
                    </p>

                `;

            }
        );


        return;

    }


    // =================================
    // チームが見つからない場合
    // =================================

    container.innerHTML = `

        <h2>
        チーム情報を取得できませんでした
        </h2>

    `;

}

    }

}

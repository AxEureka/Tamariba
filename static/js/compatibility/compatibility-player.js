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
        window.myName;


    const answerers =
        data.answerers;


    let myTarget=null;


    Object.entries(answerers)
    .forEach(
        ([team,name])=>{

            if(name===myName){

                myTarget=name;

            }

        }
    );


    // 自分が出題者

    if(myTarget){

        createRankingUI(
            container,
            data.question,
            Object.keys(answerers),
            (ranking)=>{


                socket.send(
                    JSON.stringify({

                        type:"ranking_answer",

                        answer_type:"true",

                        name:myName,

                        ranking:ranking

                    })
                );


                container.innerHTML=
                "<h2>回答しました</h2>";

            }
        );


    }

}

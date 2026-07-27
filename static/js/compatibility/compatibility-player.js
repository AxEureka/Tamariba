console.log("compatibility-player loaded");


import {
    createCompatibilityUI
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

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

                    <div class="compatibility-player-result">
                
                        <h2>
                        あなたは
                        <span style="
                        color:white;
                        font-size:1.4em;
                        ">
                        ${teamName}
                        </span>
                        です
                        </h2>
                
                        <div class="compatibility-result-card">
                
                            <h3>
                                メンバー
                            </h3>
                
                            <div class="compatibility-member-list">
                                ${team.members
                                    .map(member =>
                                        `<div class="compatibility-member">
                                            ${member}
                                        </div>`
                                    )
                                    .join("")
                                }
                            </div>
                
                        </div>
                
                        <div class="compatibility-result-card">
                
                            <h3>
                                チームの相性
                            </h3>
                
                            <div class="compatibility-score-large">
                                ${team.shown_score}%
                            </div>
                
                        </div>
                
                    </div>
                
                `;


            }

        }
    );

}

// =================================
// ランキング問題
// =================================

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
    // 自分のチームを探す
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


    const myAnswerer =
        myTeam
        ? answerers[myTeam]
        : null;


    console.log(
        "今回の自チーム代表:",
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


                container.innerHTML=`
                <div class="compatibility-card">
                    <h2>回答しました</h2>
                    <p>他の回答者の回答を待っています</p>
                </div>
                `;
            }
        );


        return;

    }


    // =================================
    // 自分が代表ではない場合
    // =================================

    container.innerHTML=`
    <div class="compatibility-card">
        <h2>回答者が回答中です</h2>
        <p>しばらくお待ちください</p>
    </div>
    `;
}



// =================================
// ランキング予想
// =================================

export function showRankingPrediction(
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
    // 自分のチームを探す
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
        "予想時の自分のチーム:",
        myTeam
    );


    // =================================
    // 自分のチームの代表
    // =================================

    const myAnswerer =
        myTeam
        ? answerers[myTeam]
        : null;


    console.log(
        "予想対象:",
        myAnswerer
    );


    // =================================
    // 自分が代表なら予想しない
    // =================================

    if(
        myAnswerer === myName
    ){

        container.innerHTML=`
        <div class="compatibility-card">
            <h2>回答者です</h2>
            <p>他のメンバーがあなたの回答を予想しています</p>
        </div>
        `;
        return;

    }


    // =================================
    // 自分が代表ではない
    // =================================

    if(myAnswerer){

        createRankingUI(
            container,
        
            data.question,
        
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
        
        
                container.innerHTML=`
                <div class="compatibility-card">
                    <h2>予想を送信しました</h2>
                    <p>他のメンバーの予想を待っています</p>
                </div>
                `;
        
            },
        
            "prediction"
        
        );
        
                return;
        
            }


    // =================================
    // チーム情報がない場合
    // =================================

    container.innerHTML = `

        <h2>
        チーム情報を取得できませんでした
        </h2>

    `;

}

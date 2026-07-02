import {
    createCompatibilityUI
}
from "./compatibility-ui.js";

export function startCompatibilityPlayer(
    socket,
    container
){

    socket.addEventListener(
        "message",
        (event)=>{

            const data =
                JSON.parse(event.data);

            // =====================
            // 相性診断開始
            // =====================
            if(
                data.type ===
                "start_compatibility"
            ){

                createCompatibilityUI(
                    container,
                    data.questions,
                    (answers)=>{

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
                            他の参加者を
                            待っています
                            </p>
                        `;
                    }
                );
            }

            // =====================
            // チーム作成完了
            // =====================
            if(
                data.type ===
                "compatibility_team_created"
            ){

                const myName =
                    window.myName ||
                    sessionStorage.getItem("playerName");
                
                Object.entries(
                    data.teams
                ).forEach(

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
        }
    );
}

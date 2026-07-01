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

            const data=
                JSON.parse(event.data);

            if(
                data.type===
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

                        container.innerHTML=`
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
        }
    );
}

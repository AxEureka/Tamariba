// ============================================
// 相性診断・サンレンタン 最終結果UI
// ============================================

console.log("compatibility-results loaded");


// ============================================
// 最終結果表示
// ============================================

export function showCompatibilityFinalResult(
    container,
    msg,
    myName,
    hostName
){

    console.log(
        "最終結果表示",
        msg
    );

    container.innerHTML = "";

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "compatibility-ui";

    // ========================================
    // タイトル
    // ========================================

    const title =
        document.createElement("h2");

    title.textContent =
        "最終結果";

    wrapper.appendChild(title);


    // ========================================
    // チームランキング
    // ========================================

    const rankingTitle =
        document.createElement("h3");

    rankingTitle.textContent =
        "チームランキング";

    wrapper.appendChild(
        rankingTitle
    );


    const rankingBox =
        document.createElement("div");

    rankingBox.className =
        "compatibility-team-list";


    // ========================================
    // team_final_ranking
    // ========================================

    if(
        msg.team_final_ranking &&
        Array.isArray(msg.team_final_ranking)
    ){

        msg.team_final_ranking.forEach(
            (item, index)=>{

                /*
                 * 想定形式
                 *
                 * {
                 *   rank: 1,
                 *   team: "高類似チーム1",
                 *   shown_score: 80,
                 *   actual_score: 75,
                 *   members: [...]
                 * }
                 */

                const rank =
                    item.rank ??
                    (index + 1);

                const teamName =
                    item.team ??
                    `チーム${index + 1}`;

                const card =
                    document.createElement("div");

                card.className =
                    "compatibility-team";


                // =================================
                // 自分のチームか確認
                // =================================

                let isMyTeam = false;

                if(
                    Array.isArray(item.members) &&
                    item.members.includes(myName)
                ){

                    isMyTeam = true;

                }


                if(isMyTeam){

                    card.style.border =
                        "3px solid gold";

                    card.style.boxShadow =
                        "0 0 15px rgba(255,215,0,0.5)";

                }


                // =================================
                // 順位
                // =================================

                const rankText =
                    document.createElement("div");

                rankText.className =
                    "compatibility-team-title";

                rankText.textContent =
                    `${rank}位　${teamName}`;

                card.appendChild(
                    rankText
                );


                // =================================
                // メンバー
                // =================================

                if(
                    Array.isArray(item.members)
                ){

                    const memberBox =
                        document.createElement("div");

                    item.members.forEach(
                        member=>{

                            const memberText =
                                document.createElement("div");

                            memberText.className =
                                "compatibility-member";

                            memberText.textContent =
                                `・${member}`;

                            memberBox.appendChild(
                                memberText
                            );

                        }
                    );

                    card.appendChild(
                        memberBox
                    );

                }


                // =================================
                // 表示相性
                // =================================

                if(
                    item.shown_score !== undefined
                ){

                    const shownScore =
                        document.createElement("div");

                    shownScore.className =
                        "compatibility-score";

                    shownScore.textContent =
                        `表示相性：${item.shown_score}%`;

                    card.appendChild(
                        shownScore
                    );

                }


                // =================================
                // 実際の相性
                // =================================

                if(
                    item.actual_score !== undefined
                ){

                    const actualScore =
                        document.createElement("div");

                    actualScore.className =
                        "compatibility-score";

                    actualScore.textContent =
                        `実際の相性：${item.actual_score}%`;

                    card.appendChild(
                        actualScore
                    );

                }


                rankingBox.appendChild(
                    card
                );

            }
        );

    }
    else{

        const empty =
            document.createElement("p");

        empty.textContent =
            "チームランキングを取得できませんでした。";

        rankingBox.appendChild(
            empty
        );

    }


    wrapper.appendChild(
        rankingBox
    );


    // ========================================
    // 問題別結果
    // ========================================

    if(
        msg.team_matrix
    ){

        const detailTitle =
            document.createElement("h3");

        detailTitle.textContent =
            "問題別結果";

        wrapper.appendChild(
            detailTitle
        );


        const detailBox =
            document.createElement("div");

        detailBox.className =
            "compatibility-team-list";


        Object.entries(
            msg.team_matrix
        ).forEach(
            ([teamName, data])=>{

                const card =
                    document.createElement("div");

                card.className =
                    "compatibility-team";


                const teamTitle =
                    document.createElement("div");

                teamTitle.className =
                    "compatibility-team-title";

                teamTitle.textContent =
                    teamName;

                card.appendChild(
                    teamTitle
                );


                // --------------------------------
                // データをそのまま確認できる
                // --------------------------------

                const pre =
                    document.createElement("pre");

                pre.style.whiteSpace =
                    "pre-wrap";

                pre.style.wordBreak =
                    "break-word";

                pre.style.fontSize =
                    "14px";

                pre.textContent =
                    JSON.stringify(
                        data,
                        null,
                        2
                    );

                card.appendChild(
                    pre
                );


                detailBox.appendChild(
                    card
                );

            }
        );


        wrapper.appendChild(
            detailBox
        );

    }


    // ========================================
    // 親・子共通
    // ========================================

    const closeText =
        document.createElement("p");

    closeText.style.marginTop =
        "20px";

    closeText.style.opacity =
        "0.7";

    closeText.textContent =
        "サンレンタン終了";

    wrapper.appendChild(
        closeText
    );


    container.appendChild(
        wrapper
    );

}

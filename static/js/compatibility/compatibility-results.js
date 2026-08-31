
// ============================================
// 相性診断・サンレンタン 最終結果UI
// ============================================

console.log("compatibility-results loaded");


// ============================================
// メイン
// ============================================

export function showCompatibilityFinalResult(
    container,
    msg,
    myName,
    hostName
){

    console.log("最終結果表示", msg);
    console.log("team_matrix", msg.team_matrix);

    // ----------------------------------------
    // 自分のチーム
    // ----------------------------------------

    let myTeam = null;

    if(myName !== hostName && msg.teams){

        for(
            const [teamName, teamInfo]
            of Object.entries(msg.teams)
        ){

            if(
                Array.isArray(teamInfo.members) &&
                teamInfo.members.includes(myName)
            ){

                myTeam = teamName;
                break;

            }

        }

    }


    // ========================================
    // ランキングページを表示
    // ========================================

    function showRankingPage(){

        container.innerHTML = "";

        const wrapper =
            document.createElement("div");
        
        wrapper.className =
            "compatibility-ui";
        
        wrapper.style.color =
            "#222";

        // ====================================
        // タイトル
        // ====================================

        const title =
            document.createElement("h2");

        title.textContent =
            "🏆 最終結果";

        title.style.textAlign =
            "center";

        wrapper.appendChild(title);


        // ====================================
        // ランキング表
        // ====================================

        const tableWrapper =
            document.createElement("div");

        tableWrapper.style.overflowX =
            "auto";

        tableWrapper.style.width =
            "100%";


        const table =
            document.createElement("table");

        table.className =
            "compatibility-ranking-table";

        table.style.width =
            "100%";

        table.style.borderCollapse =
            "collapse";

        table.style.margin =
            "20px auto";


        // ====================================
        // ヘッダー
        // ====================================

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");

        const headers = [
            "順位",
            "チーム名",
            "チーム得点",
            "表示相性",
            "実際の相性"
        ];


        headers.forEach(
            text=>{

                const th =
                    document.createElement("th");

                th.textContent =
                    text;

                th.style.border =
                    "1px solid #ccc";

                th.style.padding =
                    "10px 8px";

                th.style.textAlign =
                    "center";

                th.style.background =
                    "#f5f5f5";

                headerRow.appendChild(
                    th
                );

            }
        );


        thead.appendChild(
            headerRow
        );

        table.appendChild(
            thead
        );


        // ====================================
        // 本体
        // ====================================

        const tbody =
            document.createElement("tbody");


        const ranking =
            Array.isArray(msg.team_final_ranking)
                ? msg.team_final_ranking.slice(0,5)
                : [];


        if(ranking.length === 0){

            const row =
                document.createElement("tr");

            const cell =
                document.createElement("td");

            cell.colSpan = 5;

            cell.textContent =
                "チームランキングを取得できませんでした。";

            cell.style.textAlign =
                "center";

            cell.style.padding =
                "20px";

            row.appendChild(
                cell
            );

            tbody.appendChild(
                row
            );

        }
        else{

            ranking.forEach(
                (item,index)=>{

                    const row =
                        document.createElement("tr");


                    const teamName =
                        item.team ??
                        `チーム${index + 1}`;


                    // ----------------------------
                    // 自分のチーム
                    // ----------------------------

                    const isMyTeam =
                        myTeam !== null &&
                        teamName === myTeam;


                    if(isMyTeam){

                        row.style.background =
                            "#fff3a3";

                        row.style.fontWeight =
                            "bold";

                    }


                    // ----------------------------
                    // 順位
                    // ----------------------------

                    const rankCell =
                        document.createElement("td");

                    rankCell.textContent =
                        `${item.rank ?? index + 1}位`;

                    // ----------------------------
                    // チーム名
                    // ----------------------------

                    const teamCell =
                        document.createElement("td");

                    teamCell.textContent =
                        teamName;


                    // ----------------------------
                    // チーム得点
                    // ----------------------------

                    const scoreCell =
                        document.createElement("td");

                    scoreCell.textContent =
                        `${item.total_score ?? 0}点`;


                    // ----------------------------
                    // 表示相性
                    // ----------------------------

                    const shownCell =
                        document.createElement("td");

                    const shownScore =
                        item.shown_score;

                    shownCell.textContent =
                        shownScore !== undefined &&
                        shownScore !== null
                            ? `${shownScore}%`
                            : "―";


                    // ----------------------------
                    // 実際の相性
                    // ----------------------------

                    const actualCell =
                        document.createElement("td");

                    const actualScore =
                        item.actual_score;

                    actualCell.textContent =
                        actualScore !== undefined &&
                        actualScore !== null
                            ? `${actualScore}%`
                            : "―";


                    // ----------------------------
                    // 共通スタイル
                    // ----------------------------

                    [
                        rankCell,
                        teamCell,
                        scoreCell,
                        shownCell,
                        actualCell
                    ].forEach(
                        cell=>{

                            cell.style.border =
                                "1px solid #ccc";

                            cell.style.padding =
                                "10px 8px";

                            cell.style.textAlign =
                                "center";

                        }
                    );


                    row.appendChild(
                        rankCell
                    );

                    row.appendChild(
                        teamCell
                    );

                    row.appendChild(
                        scoreCell
                    );

                    row.appendChild(
                        shownCell
                    );

                    row.appendChild(
                        actualCell
                    );


                    tbody.appendChild(
                        row
                    );

                }
            );

        }


        table.appendChild(
            tbody
        );


        tableWrapper.appendChild(
            table
        );

        wrapper.appendChild(
            tableWrapper
        );


        // ====================================
        // チーム成績ボタン
        // ====================================

        const buttonArea =
            document.createElement("div");

        buttonArea.style.textAlign =
            "center";

        buttonArea.style.marginTop =
            "25px";


        const teamButton =
            document.createElement("button");

        teamButton.textContent =
            "チーム成績";

        teamButton.style.fontSize =
            "16px";

        teamButton.style.padding =
            "10px 24px";

        teamButton.style.cursor =
            "pointer";


        teamButton.onclick =
            showTeamResultPage;


        buttonArea.appendChild(
            teamButton
        );

        wrapper.appendChild(
            buttonArea
        );


        // ====================================
        // 終了表示
        // ====================================

        const closeText =
            document.createElement("p");

        closeText.style.marginTop =
            "20px";

        closeText.style.textAlign =
            "center";

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


    // ========================================
    // チーム成績ページ
    // ========================================

    function showTeamResultPage(){

        container.innerHTML = "";

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "compatibility-ui";


        // ====================================
        // 表示するチーム
        // ====================================

        let targetTeam = myTeam;


        // 親画面の場合
        // → 最初はチーム1

        if(!targetTeam){

            const teamNames =
                Object.keys(
                    msg.team_matrix || {}
                );

            targetTeam =
                teamNames[0] ?? null;

        }


        // ====================================
        // タイトル
        // ====================================

        const title =
            document.createElement("h2");

        title.textContent =
            targetTeam
                ? `${targetTeam}の成績`
                : "チーム成績";

        title.style.textAlign =
            "center";

        wrapper.appendChild(
            title
        );


        // ====================================
        // チームデータ
        // ====================================

        const teamData =
            targetTeam &&
            msg.team_matrix
                ? msg.team_matrix[targetTeam]
                : null;


        if(!teamData){

            const error =
                document.createElement("p");

            error.textContent =
                "チーム成績を取得できませんでした。";

            error.style.textAlign =
                "center";

            wrapper.appendChild(
                error
            );

            addBackButton(
                wrapper
            );

            container.appendChild(
                wrapper
            );

            return;

        }


        const members =
            Array.isArray(teamData.members)
                ? teamData.members
                : [];


        const questions =
            Array.isArray(teamData.questions)
                ? teamData.questions
                : [];


        // ====================================
        // マトリクス
        // ====================================

        const matrixWrapper =
            document.createElement("div");

        matrixWrapper.style.overflowX =
            "auto";

        matrixWrapper.style.width =
            "100%";


        const table =
            document.createElement("table");

        table.className =
            "compatibility-team-matrix";

        table.style.borderCollapse =
            "collapse";

        table.style.width =
            "100%";

        table.style.margin =
            "20px auto";


        // ====================================
        // ヘッダー
        // ====================================

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");


        const questionHeader =
            document.createElement("th");

        questionHeader.textContent =
            "問題";

        styleHeaderCell(
            questionHeader
        );

        headerRow.appendChild(
            questionHeader
        );


        members.forEach(
            member=>{

                const th =
                    document.createElement("th");

                th.textContent =
                    member;

                styleHeaderCell(
                    th
                );

                headerRow.appendChild(
                    th
                );

            }
        );


        thead.appendChild(
            headerRow
        );

        table.appendChild(
            thead
        );


        // ====================================
        // 問題ごとの行
        // ====================================

        const tbody =
            document.createElement("tbody");


        questions.forEach(
            questionData=>{

                const row =
                    document.createElement("tr");


                // ----------------------------
                // 問題
                // ----------------------------

                const questionCell =
                    document.createElement("td");


                const number =
                    questionData.number ??
                    "";


                const questionText =
                    questionData.question ??
                    "";


                questionCell.innerHTML =
                    `<strong>第${number}問</strong><br>${escapeHTML(questionText)}`;


                styleBodyCell(
                    questionCell
                );


                row.appendChild(
                    questionCell
                );


                // ----------------------------
                // メンバー
                // ----------------------------

                members.forEach(
                    member=>{

                        const cellData =
                            questionData.cells?.[member];


                        const cell =
                            document.createElement("td");


                        styleBodyCell(
                            cell
                        );


                        if(!cellData){

                            cell.textContent =
                                "―";

                            row.appendChild(
                                cell
                            );

                            return;

                        }


                        // ------------------------
                        // 役割
                        // ------------------------

                        if(
                            cellData.role ===
                            "answerer"
                        ){

                            cell.textContent =
                                "回答者";

                            cell.style.background =
                                "#e8f4ff";

                        }
                        else if(
                            cellData.role ===
                            "predictor"
                        ){

                            cell.textContent =
                                "予想者";

                            cell.style.background =
                                "#fff4e5";

                        }
                        else{

                            cell.textContent =
                                "―";

                        }


                        // ------------------------
                        // クリック可能
                        // ------------------------

                        cell.style.cursor =
                            "pointer";
                        
                        cell.style.userSelect =
                            "none";
                        
                        cell.title =
                            "クリックして詳細を見る";
                        
                        cell.style.textDecoration =
                            "underline";


                        cell.onclick =
                            ()=>{
                        
                                console.log(
                                    "★ マトリクスクリック:",
                                    member,
                                    cellData
                                );
                        
                                if(
                                    cellData.role ===
                                    "answerer"
                                ){
                        
                                    console.log(
                                        "★ 回答者セル"
                                    );
                        
                                    showAnswerDetail(
                                        member,
                                        cellData,
                                        questionData
                                    );
                        
                                }
                                else if(
                                    cellData.role ===
                                    "predictor"
                                ){
                        
                                    console.log(
                                        "★ 予想者セル"
                                    );
                        
                                    showPredictionDetail(
                                        member,
                                        cellData,
                                        questionData
                                    );
                        
                                }
                                else{
                        
                                    console.log(
                                        "★ role不明:",
                                        cellData.role
                                    );
                        
                                }
                        
                            };


                        row.appendChild(
                            cell
                        );

                    }
                );


                tbody.appendChild(
                    row
                );

            }
        );


        table.appendChild(
            tbody
        );


        matrixWrapper.appendChild(
            table
        );

        wrapper.appendChild(
            matrixWrapper
        );


        // ====================================
        // ランキングへ戻る
        // ====================================

        addBackButton(
            wrapper
        );


        container.appendChild(
            wrapper
        );


        // ====================================
        // 回答詳細
        // ====================================

        function showAnswerDetail(
            member,
            cellData,
            questionData
        ){
        
            console.log(
                "回答者詳細JSON",
                JSON.stringify(
                    cellData,
                    null,
                    2
                )
            );
        
            const ranking =
                Array.isArray(cellData.answer)
                    ? cellData.answer
                    : Array.isArray(cellData.ranking)
                        ? cellData.ranking
                        : [];
        
        
            showModal(
                `${member}さんの回答`,
                createRankingList(
                    ranking,
                    questionData?.choices
                )
            );
        
        }

        // ====================================
        // 予想詳細
        // ====================================

       function showPredictionDetail(
            member,
            cellData,
            questionData
        ){
        
            console.log(
                "予想者詳細:",
                member,
                cellData
            );
        
            const ranking =
                Array.isArray(cellData.prediction)
                    ? cellData.prediction
                    : Array.isArray(cellData.ranking)
                        ? cellData.ranking
                        : [];
        
        
            const target =
                cellData.target ??
                "―";


            const resultList =
                Array.isArray(cellData.results)
                    ? cellData.results
                    : [];


            const content =
                document.createElement("div");


            const targetText =
                document.createElement("p");

            targetText.textContent =
                `予想対象：${target}`;

            content.appendChild(
                targetText
            );


            const rankingTitle =
                document.createElement("h4");

            rankingTitle.textContent =
                "予想";

            content.appendChild(
                rankingTitle
            );


            content.appendChild(
                createRankingList(
                    ranking,
                    questionData?.choices
                )
            );


            // ----------------------------
            // 判定結果
            // ----------------------------

            if(resultList.length > 0){

                const result =
                    resultList[0];


                const resultTitle =
                    document.createElement("h4");

                resultTitle.textContent =
                    "結果";

                content.appendChild(
                    resultTitle
                );


                const resultText =
                    document.createElement("p");


                resultText.style.fontWeight =
                    "bold";


                resultText.textContent =
                    `${result.type ?? "―"}　＋${result.score ?? 0}点`;


                content.appendChild(
                    resultText
                );

            }


            showModal(
                `${member}さんの予想`,
                content
            );

        }

    }


    // ========================================
    // ランキングリスト生成
    // ========================================

    function createRankingList(
        ranking,
        choices = []
    ){

        const box =
            document.createElement("div");


        if(!Array.isArray(ranking) ||
           ranking.length === 0){

            const empty =
                document.createElement("p");

            empty.textContent =
                "回答データがありません。";

            box.appendChild(
                empty
            );

            return box;

        }


        ranking.forEach(
            (choice,index)=>{
        
                const line =
                    document.createElement("div");
        
        
                // --------------------------------
                // 選択肢ID → 選択肢名
                // --------------------------------
        
                let text = choice;
        
                const choiceData =
                    choices.find(
                        c =>
                            Number(c.id) ===
                            Number(choice)
                    );
        
                if(choiceData){
        
                    text =
                        choiceData.text;
        
                }
                else if(
                    typeof choice !== "string"
                ){
        
                    if(
                        choice &&
                        typeof choice.text ===
                        "string"
                    ){
        
                        text =
                            choice.text;
        
                    }
                    else{
        
                        text =
                            JSON.stringify(
                                choice
                            );
        
                    }
        
                }
        
        
                line.textContent =
                    `${index + 1}位　${text}`;
        
        
                line.style.margin =
                    "6px 0";
        
        
                box.appendChild(
                    line
                );
        
            }
        );

        return box;

    }


    // ========================================
    // モーダル
    // ========================================

    function showModal(
        titleText,
        content
    ){

        console.log(
            "showModal",
            titleText,
            content
        );

        const overlay =
            document.createElement("div");

        overlay.style.position =
            "fixed";

        overlay.style.left =
            "0";

        overlay.style.top =
            "0";

        overlay.style.width =
            "100%";

        overlay.style.height =
            "100%";

        overlay.style.background =
            "rgba(0,0,0,0.45)";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        overlay.style.zIndex =
            "9999";


        const modal =
            document.createElement("div");

        modal.style.background =
            "white";

        modal.style.color =
            "#222";

        modal.style.borderRadius =
            "12px";

        modal.style.padding =
            "25px";

        modal.style.width =
            "min(90%, 420px)";

        modal.style.maxHeight =
            "80vh";

        modal.style.overflowY =
            "auto";

        modal.style.boxShadow =
            "0 5px 25px rgba(0,0,0,0.3)";


        const title =
            document.createElement("h3");

        title.textContent =
            titleText;

        title.style.marginTop =
            "0";

        modal.appendChild(
            title
        );


        modal.appendChild(
            content
        );


        const closeButton =
            document.createElement("button");

        closeButton.textContent =
            "閉じる";

        closeButton.style.display =
            "block";

        closeButton.style.margin =
            "20px auto 0";

        closeButton.style.padding =
            "8px 20px";

        closeButton.style.cursor =
            "pointer";


        closeButton.onclick =
            ()=>{

                overlay.remove();

            };


        modal.appendChild(
            closeButton
        );


        overlay.appendChild(
            modal
        );


        // 背景クリックでも閉じる

        overlay.onclick =
            e=>{

                if(e.target === overlay){

                    overlay.remove();

                }

            };

        console.log(
            "overlay append"
        );


        document.body.appendChild(
            overlay
        );

    }


    // ========================================
    // ランキングへ戻るボタン
    // ========================================

    function addBackButton(
        wrapper
    ){

        const area =
            document.createElement("div");

        area.style.textAlign =
            "center";

        area.style.marginTop =
            "25px";


        const button =
            document.createElement("button");

        button.textContent =
            "ランキングを見る";

        button.style.fontSize =
            "16px";

        button.style.padding =
            "10px 24px";

        button.style.cursor =
            "pointer";


        button.onclick =
            showRankingPage;


        area.appendChild(
            button
        );

        wrapper.appendChild(
            area
        );

    }


    // ========================================
    // スタイル
    // ========================================

    function styleHeaderCell(
        cell
    ){

        cell.style.border =
            "1px solid #ccc";

        cell.style.padding =
            "10px 8px";

        cell.style.textAlign =
            "center";

        cell.style.background =
            "#f5f5f5";

        cell.style.whiteSpace =
            "nowrap";

    }


    function styleBodyCell(
        cell
    ){

        cell.style.border =
            "1px solid #ccc";

        cell.style.padding =
            "10px 8px";

        cell.style.textAlign =
            "center";

        cell.style.verticalAlign =
            "middle";

    }


    // ========================================
    // HTMLエスケープ
    // ========================================

    function escapeHTML(
        value
    ){

        return String(value)
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");

    }


    // ========================================
    // 最初はランキングページ
    // ========================================

    showRankingPage();

}

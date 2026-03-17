from fastapi import FastAPI

app = FastAPI()

# =========================
# WebSocket
# =========================
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    await websocket.accept()
    print("WS接続:", room_id)

    if room_id not in rooms:
        rooms[room_id] = {
            "room": "room",
            "host": "",
            "theme": "mansion",
            "members": [],
            "sockets": [],
            "answers": {},
            "nasa_answers": {},
            "nasa": {}
        }

    room = rooms[room_id]
    room["sockets"].append(websocket)

    try:
        while True:

            data = await websocket.receive_json()
            msg_type = data.get("type")

            print("WS受信:", data)

            # =========================
            # NASA開始（問題設定）
            # =========================
            if msg_type == "nasa_start":

                room["nasa"] = {
                    "items": data.get("items", []),
                    "correct": data.get("correct", [])
                }

                room["nasa_answers"] = {}

                await broadcast(room, {
                    "type": "nasa_start",
                    "items": room["nasa"]["items"]
                })

            # =========================
            # NASA個人回答
            # =========================
            elif msg_type == "nasa_personal":

                name = data.get("name")
                ranks = data.get("ranks", [])

                if name:
                    room["nasa_answers"][name] = {
                        "personal": ranks
                    }

            # =========================
            # NASAチーム回答
            # =========================
            elif msg_type == "nasa_team":

                name = data.get("name")
                team = data.get("team", "チーム")
                ranks = data.get("ranks", [])

                if name:
                    if name not in room["nasa_answers"]:
                        room["nasa_answers"][name] = {}

                    room["nasa_answers"][name]["team"] = ranks
                    room["nasa_answers"][name]["team_name"] = team

            # =========================
            # NASA結果発表
            # =========================
            elif msg_type == "nasa_show_result":

                await broadcast(room, {
                    "type": "nasa_result",
                    "correct": room["nasa"].get("correct", [])
                })

            # =========================
            # ランキング取得
            # =========================
            elif msg_type == "nasa_get_ranking":

                correct = room["nasa"].get("correct", [])

                def calc(arr):
                    if not arr or not correct:
                        return 0
                    return sum(abs(arr[i] - correct[i]) for i in range(min(len(arr), len(correct))))

                personal_scores = []
                team_scores = {}

                for name, a in room["nasa_answers"].items():

                    # 個人
                    if "personal" in a:
                        s = calc(a["personal"])
                        personal_scores.append((name, s))

                    # チーム
                    if "team" in a:
                        t = a.get("team_name", "チーム")
                        s = calc(a["team"])
                        team_scores.setdefault(t, []).append(s)

                # 個人ランキング
                personal_scores.sort(key=lambda x: x[1])

                personal_avg = (
                    sum(s for _, s in personal_scores) / len(personal_scores)
                    if personal_scores else 0
                )

                # チーム平均
                team_avg_dict = {
                    t: sum(v) / len(v)
                    for t, v in team_scores.items()
                }

                team_top = sorted(team_avg_dict.items(), key=lambda x: x[1])[:3]

                team_avg = (
                    sum(team_avg_dict.values()) / len(team_avg_dict)
                    if team_avg_dict else 0
                )

                await broadcast(room, {
                    "type": "nasa_ranking",
                    "personal_top": [
                        {"name": n, "score": s}
                        for n, s in personal_scores[:3]
                    ],
                    "personal_avg": round(personal_avg, 1),
                    "team_top": [
                        {"name": n, "score": round(s, 1)}
                        for n, s in team_top
                    ],
                    "team_avg": round(team_avg, 1)
                })

            # =========================
            # NASA終了
            # =========================
            elif msg_type == "end_nasa":

                await broadcast(room, {
                    "type": "end_nasa"
                })

    except WebSocketDisconnect:
        if websocket in room["sockets"]:
            room["sockets"].remove(websocket)

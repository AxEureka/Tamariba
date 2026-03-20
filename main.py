from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

# =========================
# 静的ファイル
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


# =========================
# ルーム管理
# =========================
rooms = {}

# =========================
# ルーム作成
# =========================
@app.post("/create_room")
async def create_room(data: dict):

    room_id = str(uuid.uuid4())[:8]

    host = data.get("host_name")
    room_name = data.get("room_name")
    theme = data.get("theme", "mansion")

    rooms[room_id] = {
        "room": room_name,
        "host": host,
        "theme": theme,
        "members": [host],
        "sockets": [],
        "answers": {},
        "nasa_answers": {},
        "nasa": {},
        "team_answers": {},
        "teams": {},
        "team_count": 0,
        "team_leaders": {}
    }

    return {"room_id": room_id}


# =========================
# ルーム情報取得
# =========================
@app.get("/room/{room_id}")
async def get_room(room_id: str):

    if room_id not in rooms:
        return JSONResponse({"error": "room not found"}, status_code=404)

    room = rooms[room_id]

    return {
        "room": room["room"],
        "host": room["host"],
        "theme": room["theme"]
    }


# =========================
# 入室
# =========================
@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):

    if room_id not in rooms:
        return {"ok": False}

    name = data.get("name")

    if name and name not in rooms[room_id]["members"]:
        rooms[room_id]["members"].append(name)

    return {"ok": True}


# =========================
# メンバー取得
# =========================
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):

    if room_id not in rooms:
        return {"members": [], "count": 0}

    members = rooms[room_id]["members"]

    return {
        "members": members,
        "count": len(members)
    }


# =========================
# キック
# =========================
@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):

    if room_id not in rooms:
        return {"ok": False}

    name = data.get("name")

    if name in rooms[room_id]["members"]:
        rooms[room_id]["members"].remove(name)

    return {"ok": True}


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
            "nasa": {},
            "team_answers": {},
            "teams": {},
            "team_count": 0,
            "team_leaders": {}
        }

    room = rooms[room_id]
    room["sockets"].append(websocket)

    try:
        while True:

            data = await websocket.receive_json()
            msg_type = data.get("type")

            print("WS受信:", data)

            # =========================
            # クイズ
            # =========================
            if msg_type == "start_quiz":
                await broadcast(room, {"type": "start_quiz"})

            elif msg_type == "quiz_question":
                room["answers"] = {}

                await broadcast(room, {
                    "type": "quiz_question",
                    "question": data.get("question"),
                    "choices": data.get("choices")
                })

            elif msg_type == "quiz_answer":
                name = data.get("name")
                choice = data.get("choice")

                if name is not None:
                    room["answers"][name] = choice

                votes = [0, 0, 0, 0]

                for v in room["answers"].values():
                    if v is not None and 0 <= v < 4:
                        votes[v] += 1

                await broadcast(room, {
                    "type": "quiz_votes",
                    "votes": votes
                })

            elif msg_type == "quiz_show_graph":
                await broadcast(room, {"type": "quiz_show_graph"})

            elif msg_type == "quiz_correct":
                await broadcast(room, {
                    "type": "quiz_correct",
                    "correct": data.get("correct")
                })

            elif msg_type == "end_quiz":
                await broadcast(room, {"type": "end_quiz"})

            # =========================
            # NASA
            # =========================
            elif msg_type == "nasa_start":

                room["nasa"] = {
                    "items": data.get("items", []),
                    "correct": data.get("correct", [])
                }
            
                room["nasa_answers"] = {}
                room["team_answers"] = {}
                room["team_leaders"] = {}
            
                await broadcast(room, {
                    "type": "nasa_start",
                    "items": room["nasa"]["items"]
                })
           
            
            # =========================
            # チーム機能
            # =========================
            elif msg_type == "set_team_count":
            
                count = data.get("count", 2)
                room["team_count"] = count
            
                room["teams"] = {f"チーム{i+1}": [] for i in range(count)}
                room["team_leaders"] = {}
            
                await broadcast(room, {
                    "type": "team_count_set",
                    "teams": list(room["teams"].keys())
                })
            
            
            elif msg_type == "select_team":
            
                name = data.get("name")
                team = data.get("team")
            
                for t in room["teams"]:
                    if name in room["teams"][t]:
                        room["teams"][t].remove(name)
            
                if team in room["teams"]:
                    room["teams"][team].append(name)
            
                await broadcast(room, {
                    "type": "team_update",
                    "teams": room["teams"]
                })
            
            
            # ★追加：リーダーフェーズ開始
            elif msg_type == "start_leader_phase":
            
                await broadcast(room, {
                    "type": "leader_phase_start",
                    "teams": room["teams"]
                })
            
            
            # ★修正：1チーム1リーダー制御
            elif msg_type == "set_team_leader":
            
                team = data.get("team")
                leader = data.get("leader")
            
                # 既に決まってたら無視
                if team in room["team_leaders"]:
                    return
            
                if team in room["teams"] and leader in room["teams"][team]:
                    room["team_leaders"][team] = leader
            
                    await broadcast(room, {
                        "type": "team_leader_set",
                        "team": team,
                        "leader": leader
                    })
            
            
            elif msg_type == "start_team_phase":
            
                await broadcast(room, {
                    "type": "team_phase_start",
                    "teams": room["teams"],
                    "leaders": room["team_leaders"]
                })
            # =========================
            # ランキング
            # =========================
            elif msg_type == "nasa_get_ranking":

                correct = room["nasa"].get("correct", [])
                my_name = data.get("name")

                def calc(arr):
                    if not arr or not correct:
                        return 0
                    return sum(
                        abs(arr[i] - correct[i])
                        for i in range(min(len(arr), len(correct)))
                    )

                personal_scores = []
                team_scores = {}

                for t, ranks in room["team_answers"].items():
                    team_scores[t] = [calc(ranks)]

                my_personal = None
                my_team = None

                for name, a in room["nasa_answers"].items():

                    if "personal" in a:
                        s = calc(a["personal"])
                        personal_scores.append((name, s))

                        if name == my_name:
                            my_personal = s

                    if name == my_name:
                        my_team = a.get("team_name")

                personal_scores.sort(key=lambda x: x[1])

                personal_avg = (
                    sum(s for _, s in personal_scores) / len(personal_scores)
                    if personal_scores else 0
                )

                team_avg_dict = {
                    t: sum(v) / len(v)
                    for t, v in team_scores.items()
                }

                team_top = sorted(team_avg_dict.items(), key=lambda x: x[1])[:3]

                team_avg = (
                    sum(team_avg_dict.values()) / len(team_avg_dict)
                    if team_avg_dict else 0
                )

                await websocket.send_json({
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
                    "team_avg": round(team_avg, 1),
                    "my_personal": my_personal,
                    "my_team": my_team
                })

            elif msg_type == "end_nasa":
                await broadcast(room, {"type": "end_nasa"})

    except WebSocketDisconnect:
        if websocket in room["sockets"]:
            room["sockets"].remove(websocket)


# =========================
# broadcast
# =========================
async def broadcast(room, message):
    for socket in room["sockets"]:
        await socket.send_json(message)

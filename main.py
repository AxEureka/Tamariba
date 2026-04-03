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

def get_name(room, user_id):
    for m in room["members"]:
        if m["id"] == user_id:
            return m["name"]
    return "Unknown"


# =========================
# ルーム作成
# =========================
@app.post("/create_room")
async def create_room(data: dict):
    room_id = str(uuid.uuid4())[:8]
    host_name = data.get("host_name")
    room_name = data.get("room_name")
    theme = data.get("theme", "mansion")

    host_id = str(uuid.uuid4())[:8]

    rooms[room_id] = {
        "room": room_name,
        "host": host_name,
        "theme": theme,
        "members": [{"id": host_id, "name": host_name}],
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


# /room/{room_id}/join
@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):
    if room_id not in rooms:
        return {"ok": False}

    name = data.get("name")
    # 既に同じ名前がいないか確認（重複防止）
    existing = next((m for m in rooms[room_id]["members"] if m["name"] == name), None)
    if existing:
        user_id = existing["id"]  # 既存IDを使う
    else:
        user_id = str(uuid.uuid4())[:8]
        rooms[room_id]["members"].append({"id": user_id, "name": name})

    return {"ok": True, "id": user_id}


# /room/{room_id}/members
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):
    if room_id not in rooms:
        return {"members": [], "count": 0}
    members = rooms[room_id]["members"]
    # 文字列だけのメンバーはいない想定で返す
    return {"members": [{"id": m["id"], "name": m["name"]} for m in members],
            "count": len(members)}

@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):
    if room_id not in rooms:
        return {"ok": False}
    name = data.get("name")

    # nameで削除（フロント互換のため）
    rooms[room_id]["members"] = [m for m in rooms[room_id]["members"] if m["name"] != name]

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

            # nameもidも受ける（互換）
            user_id = data.get("id")
            name = data.get("name")

            # nameしか来ない場合はidに変換
            if not user_id and name:
                for m in room["members"]:
                    if m["name"] == name:
                        user_id = m["id"]
                        break

            print("現在のソケット数:", len(room["sockets"]))

            # =========================
            # 親メッセージ
            # =========================
            if msg_type == "host_message":
                text = data.get("text", "")
                target = data.get("target")
                if not text:
                    continue
                if not target:
                    await broadcast(room, {"type": "host_message", "text": text})
                else:
                    for socket in room["sockets"]:
                        try:
                            await socket.send_json({"type": "host_message", "text": text, "target": target})
                        except:
                            pass

            # =========================
            # クイズ
            # =========================
            elif msg_type == "start_quiz":
                await broadcast(room, {"type": "start_quiz"})

            elif msg_type == "quiz_question":
                room["answers"] = {}
                await broadcast(room, {
                    "type": "quiz_question",
                    "question": data.get("question"),
                    "choices": data.get("choices")
                })

            elif msg_type == "quiz_answer":
                choice = data.get("choice")
                if user_id:
                    room["answers"][user_id] = choice

                votes = [0, 0, 0, 0]
                for v in room["answers"].values():
                    if v is not None and 0 <= v < 4:
                        votes[v] += 1

                await broadcast(room, {"type": "quiz_votes", "votes": votes})

            elif msg_type == "quiz_show_graph":
                await broadcast(room, {"type": "quiz_show_graph"})

            elif msg_type == "quiz_correct":
                await broadcast(room, {"type": "quiz_correct", "correct": data.get("correct")})

            elif msg_type == "end_quiz":
                await broadcast(room, {"type": "end_quiz"})

            # =========================
            # NASA
            # =========================
            elif msg_type == "start_nasa":
                items = data.get("items")
                correct = data.get("correct")
                if not items or not correct:
                    items = ["パラシュート", "箱に入ったマッチ", "宇宙食", "45口径ピストル2丁",
                             "粉ミルク1ケース", "酸素ボンベ2本", "15mのナイロン製ロープ",
                             "ソーラー発電式の携帯用ヒーター", "月面用の星図表", "自動的に膨らむ救命ボート",
                             "方位磁石", "水19L", "注射器の入った救急箱", "太陽電池のFM送受信器", "照明弾"]
                    correct = [8, 15, 4, 11, 12, 1, 6, 13, 3, 9, 14, 2, 7, 5, 10]
                room["nasa"] = {"items": items, "correct": correct}
                room["nasa_answers"] = {}
                room["team_answers"] = {}
                room["team_leaders"] = {}
                await broadcast(room, {"type": "start_nasa", "items": room["nasa"]["items"]})
        
            elif msg_type == "set_team_count":
                room["team_count"] = data.get("count", 2)
                room["team_names"] = data.get("names", [])

            elif msg_type == "start_team_phase":
                names = room.get("team_names", [])
                room["teams"] = {(names[i] if i < len(names) else f"チーム{i+1}"): [] for i in range(room.get("team_count", 2))}
                await broadcast(room, {"type": "team_phase_start", "teams": room["teams"]})

            elif msg_type == "select_team":
                team = data.get("team")

                if team in room["teams"] and user_id:
                    for t in room["teams"]:
                        if user_id in room["teams"][t]:
                            room["teams"][t].remove(user_id)
                    room["teams"][team].append(user_id)

                selected = sum(len(members) for members in room["teams"].values())
                total = len(room["members"])

                await broadcast(room, {"type": "team_update", "teams": room["teams"], "selected": selected, "total": total})

            elif msg_type == "start_leader_phase":
                await broadcast(room, {"type": "leader_phase_start", "teams": room["teams"]})

            elif msg_type == "set_team_leader":
                team = data.get("team")
                leader = data.get("leader")
                if team:
                    room["team_leaders"][team] = leader
                await broadcast(room, {"type": "team_leader_set", "team": team, "leader": leader})

            elif msg_type == "nasa_show_result":
                await broadcast(room, {
                    "type": "nasa_result",
                    "correct": room["nasa"].get("correct", []),
                    "personal_answers": room["nasa_answers"],
                    "team_answers": room["team_answers"]
                })

            elif msg_type == "nasa_personal":
                ranks = data.get("ranks")
                if not ranks or any(r is None for r in ranks):
                    continue

                if user_id:
                    room["nasa_answers"][user_id] = {"personal": ranks}

                await broadcast(room, {
                    "type": "nasa_personal_progress",
                    "done": len([a for a in room["nasa_answers"].values() if "personal" in a]),
                    "total": len(room["members"])
                })

            elif msg_type == "nasa_team":
                team = data.get("team")
                ranks = data.get("ranks")

                if not ranks or any(r is None for r in ranks):
                    continue

                if team:
                    room["team_answers"][team] = ranks
                    for member in room["teams"].get(team, []):
                        if member not in room["nasa_answers"]:
                            room["nasa_answers"][member] = {}
                        room["nasa_answers"][member]["team_name"] = team

                await broadcast(room, {
                    "type": "nasa_team_progress",
                    "done": len(room["team_answers"]),
                    "total": len(room["teams"])
                })

                await broadcast(room, {"type": "team_answer_done", "team": team})

            elif msg_type == "nasa_get_ranking":
                correct = room["nasa"].get("correct", [])
                my_id = user_id

                def calc(arr):
                    if not arr or not correct:
                        return 0
                    score = 0
                    for i in range(min(len(arr), len(correct))):
                        try:
                            if arr[i] is None:
                                continue
                            score += abs(int(arr[i]) - correct[i])
                        except:
                            continue
                    return score

                personal_scores = []
                team_scores = {}

                for t, ranks in room["team_answers"].items():
                    team_scores[t] = [calc(ranks)]

                my_personal = None
                my_team = None

                for uid, a in room["nasa_answers"].items():
                    if "personal" in a:
                        s = calc(a["personal"])
                        personal_scores.append((get_name(room, uid), s))
                        if uid == my_id:
                            my_personal = s
                    if uid == my_id:
                        my_team = a.get("team_name")

                personal_scores.sort(key=lambda x: x[1])

                personal_avg = sum(s for _, s in personal_scores) / len(personal_scores) if personal_scores else 0
                team_avg_dict = {t: sum(v) / len(v) for t, v in team_scores.items()}
                team_top = sorted(team_avg_dict.items(), key=lambda x: x[1])
                team_avg = sum(team_avg_dict.values()) / len(team_avg_dict) if team_avg_dict else 0
                my_team_score = next((team_scores[t][0] for t in team_scores if t == my_team), None)
                my_diff = my_personal - my_team_score if my_personal is not None and my_team_score is not None else None

                await websocket.send_json({
                    "type": "nasa_ranking",
                    "personal_top": [{"name": n, "score": s} for n, s in personal_scores],
                    "personal_avg": round(personal_avg, 1),
                    "team_top": [{"name": n, "score": round(s, 1)} for n, s in team_top],
                    "team_avg": round(team_avg, 1),
                    "my_personal": my_personal,
                    "my_team_score": my_team_score,
                    "my_diff": my_diff,
                    "my_team_name": my_team
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
    dead_sockets = []
    for socket in room["sockets"]:
        try:
            await socket.send_json(message)
        except Exception as e:
            print("送信失敗:", e)
            dead_sockets.append(socket)
    for s in dead_sockets:
        if s in room["sockets"]:
            room["sockets"].remove(s)

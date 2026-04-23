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


@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):
    if room_id not in rooms:
        return {"ok": False}
    name = data.get("name")
    if name and name not in rooms[room_id]["members"]:
        rooms[room_id]["members"].append(name)
    return {"ok": True}


@app.get("/room/{room_id}/members")
async def get_members(room_id: str):
    if room_id not in rooms:
        return {"members": [], "count": 0}
    members = rooms[room_id]["members"]
    return {"members": members, "count": len(members)}


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
            print("現在のソケット数:", len(room["sockets"]))

            # =========================
            # 親からのメッセージ（全体 or 個別）
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
            
                # ★択数保存（超重要）
                room["last_choices"] = data.get("choices", [])
            
                await broadcast(room, {
                    "type": "quiz_question",
                    "question": data.get("question"),
                    "choices": room["last_choices"],
                    "timer": data.get("timer")  # ★追加
                })
            
            
            elif msg_type == "quiz_answer":
                name = data.get("name")
                choice = data.get("choice")
            
                if name is not None:
                    room["answers"][name] = choice
            
                # ★択数に応じたvotes生成
                choice_len = len(room.get("last_choices", []))
                votes = [0] * choice_len
            
                for v in room["answers"].values():
                    if v is not None and 0 <= v < choice_len:
                        votes[v] += 1
            
                await broadcast(room, {
                    "type": "quiz_votes",
                    "votes": votes
                })
            
            
            elif msg_type == "quiz_show_graph":
                # ★ここが一番重要（votesを一緒に送る）
                choice_len = len(room.get("last_choices", []))
                votes = [0] * choice_len
            
                for v in room["answers"].values():
                    if v is not None and 0 <= v < choice_len:
                        votes[v] += 1
            
                await broadcast(room, {
                    "type": "quiz_show_graph",
                    "votes": votes
                })
            
            
            elif msg_type == "quiz_timer_end":
                # ★追加（playerが待ってる）
                await broadcast(room, {"type": "quiz_timer_end"})


            elif msg_type == "quiz_score":
                score_map = data.get("scores")
            
                if "scores" not in room:
                    room["scores"] = {}
            
                for name, choice in room["answers"].items():
                    if name not in room["scores"]:
                        room["scores"][name] = 0
            
                    room["scores"][name] += score_map.get(choice, 0)
            
                await broadcast(room, {
                    "type": "quiz_score_update",
                    "scores": room["scores"]
                })
            
            
            elif msg_type == "quiz_correct":
                await broadcast(room, {
                    "type": "quiz_correct",
                    "correct": data.get("correct")
                })

            elif msg_type == "quiz_get_ranking":
                scores = room.get("scores", {})
            
                sorted_scores = sorted(scores.items(), key=lambda x: -x[1])
            
                ranking = []
                prev_score = None
                rank = 0
            
                for i, (name, score) in enumerate(sorted_scores):
                    if score != prev_score:
                        rank = i + 1
                        prev_score = score
            
                    ranking.append((rank, name, score))
            
                    if len(ranking) >= 5:
                        break
            
                await broadcast(room, {
                    "type": "quiz_ranking",
                    "ranking": ranking
                })
            
            elif msg_type == "end_quiz":
                await broadcast(room, {"type": "end_quiz"})
            # =========================
            # NASA
            # =========================
            elif msg_type == "start_nasa":
                room["nasa"] = {"items": data.get("items", []), "correct": data.get("correct", [])}
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
                name = data.get("name")
                team = data.get("team")
                if team in room["teams"]:
                    for t in room["teams"]:
                        if name in room["teams"][t]:
                            room["teams"][t].remove(name)
                    room["teams"][team].append(name)
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
                name = data.get("name")
                ranks = data.get("ranks")
                if not ranks or any(r is None for r in ranks):
                    print("不正データ検出（personal）:", ranks)
                    continue
                if name:
                    room["nasa_answers"][name] = {"personal": ranks}
                await broadcast(room, {
                    "type": "nasa_personal_progress",
                    "done": len([a for a in room["nasa_answers"].values() if "personal" in a]),
                    "total": len(room["members"])
                })

            elif msg_type == "nasa_team":
                name = data.get("name")
                team = data.get("team")
                ranks = data.get("ranks")
                if not ranks or any(r is None for r in ranks):
                    print("不正データ検出（team）:", ranks)
                    continue
                if team:
                    # チーム回答を保存
                    room["team_answers"][team] = ranks
            
                    # チームメンバー全員に team_name を付与
                    for member in room["teams"].get(team, []):
                        if member not in room["nasa_answers"]:
                            room["nasa_answers"][member] = {}
                        room["nasa_answers"][member]["team_name"] = team
                        # 非リーダーには空の personal を作ることで送信完了扱いに
                        if "personal" not in room["nasa_answers"][member]:
                            room["nasa_answers"][member]["personal"] = None
            
                # 親画面向けチーム進捗
                team_done_count = len(room["team_answers"])  # 回答済みチーム数
                total_team_count = len(room["teams"])
                
                await broadcast(room, {
                    "type": "nasa_team_progress",
                    "done": team_done_count,
                    "total": total_team_count  # チーム数
                })            
                # ★これ追加
                await broadcast(room, {
                    "type": "team_answer_done",
                    "team": team
                })             
            elif msg_type == "nasa_get_ranking":
                correct = room["nasa"].get("correct", [])
                my_name = data.get("name")
            
                # 絶対誤差計算関数
                def calc(arr):
                    if not arr or not correct:
                        return 0
                    score = 0
                    for i in range(min(len(arr), len(correct))):
                        if arr[i] is None:
                            continue
                        score += abs(int(arr[i]) - correct[i])
                    return score
            
                # ------------------------
                # 個人スコア
                # ------------------------
                personal_scores = []
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
            
                # ------------------------
                # チームスコア（リーダーの回答のみ）
                # ------------------------
                team_scores = []
                for team, ranks in room["team_answers"].items():
                    s = calc(ranks)
                    team_scores.append((team, s))
            
                # ------------------------
                # ランキング生成（昇順：スコア小さい方が上位）
                # ------------------------
                def make_rank_list(scores):
                    sorted_scores = sorted(scores, key=lambda x: x[1])  # スコア小さい順
                    result = []
                    prev_score = None
                    display_rank = 0
                    for i, (name, score) in enumerate(sorted_scores):
                        if score != prev_score:
                            display_rank += 1
                            prev_score = score
                        if display_rank > 3:
                            break
                        result.append({"name": name, "score": score, "rank": display_rank})
                    return result
            
                personal_top = make_rank_list(personal_scores)
                team_top = make_rank_list(team_scores)
            
                personal_avg = sum(s for _, s in personal_scores)/len(personal_scores) if personal_scores else 0
                team_avg = sum(s for _, s in team_scores)/len(team_scores) if team_scores else 0
                my_team_score = next((s for t, s in team_scores if t == my_team), None)
                my_diff = my_personal - my_team_score if my_personal is not None and my_team_score is not None else None
            
                await websocket.send_json({
                    "type": "nasa_ranking",
                    "personal_top": personal_top,
                    "personal_avg": round(personal_avg, 1),
                    "team_top": [{"name": n, "score": s, "rank": r} for n, s, r in [(t["name"], t["score"], t["rank"]) for t in team_top]],
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

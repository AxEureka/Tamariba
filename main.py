from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# =========================
# ルームデータ
# =========================
rooms = {}

# =========================
# ルート
# =========================
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


# =========================
# ルーム作成
# =========================
@app.post("/create_room")
async def create_room(data: dict):

    room_id = str(uuid.uuid4())[:8]

    host_name = data["host_name"]
    room_name = data["room_name"]
    theme = data["theme"]

    rooms[room_id] = {
        "host": host_name,
        "room_name": room_name,
        "theme": theme,

        "mode": None,
        "status": "waiting",

        "players": {
            host_name: {
                "nickname": host_name,
                "score": 0,
                "answer": None,
                "connected": True
            }
        },

        "current_question": None,

        "votes": {
            "A": [],
            "B": [],
            "C": [],
            "D": []
        },

        "connections": []
    }

    return {"room_id": room_id, "theme": theme}


# =========================
# ルーム情報取得
# =========================
@app.get("/room/{room_id}")
async def get_room(room_id: str, name: str = None):

    room = rooms.get(room_id)

    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    if name and name not in room["players"]:
        room["players"][name] = {
            "nickname": name,
            "score": 0,
            "answer": None,
            "connected": True
        }

    return {
        "host": room["host"],
        "room": room["room_name"],
        "theme": room["theme"]
    }


# =========================
# 参加
# =========================
@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):

    room = rooms.get(room_id)

    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    name = data.get("name")

    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)

    if name not in room["players"]:
        room["players"][name] = {
            "nickname": name,
            "score": 0,
            "answer": None,
            "connected": True
        }

    return {
        "count": len(room["players"]),
        "members": list(room["players"].keys())
    }


# =========================
# Kick / 自発退出
# =========================
@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):

    room = rooms.get(room_id)

    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    target = data.get("name")

    if not target:
        return JSONResponse({"error": "name required"}, status_code=400)

    if target in room["players"] and target != room["host"]:
        del room["players"][target]

    return {
        "count": len(room["players"]),
        "members": list(room["players"].keys())
    }


# =========================
# メンバー一覧
# =========================
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):

    room = rooms.get(room_id)

    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    return {
        "count": len(room["players"]),
        "members": list(room["players"].keys())
    }


# =========================
# ルーム閉鎖
# =========================
@app.post("/room/{room_id}/close")
async def close_room(room_id: str):

    if room_id in rooms:
        del rooms[room_id]

    return {"status": "closed"}


# =========================
# クイズ出題API（最小版）
# =========================
@app.post("/room/{room_id}/quiz/start")
async def start_quiz(room_id: str, data: dict):

    room = rooms.get(room_id)

    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    name = data.get("name")
    question = data.get("question")
    choices = data.get("choices")

    if name != room["host"]:
        return JSONResponse({"error": "only host can start"}, status_code=403)

    if not question or not choices:
        return JSONResponse({"error": "invalid data"}, status_code=400)

    room["current_question"] = {
        "question": question,
        "choices": choices,
        "status": "answering"
    }

    room["votes"] = {c: [] for c in choices}

    await broadcast(room, {
        "type": "new_question",
        "question": question,
        "choices": choices
    })

    return {"status": "started"}


# =========================
# WebSocket
# =========================
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    print("WS接続要求:", room_id)
    print("現在のrooms:", list(rooms.keys()))

    room = rooms.get(room_id)

    if not room:
        await websocket.close()
        return

    await websocket.accept()

    room["connections"].append(websocket)

    try:

        while True:

            data = await websocket.receive_json()

            # =========================
            # 新しい問題
            # =========================
            if data.get("type") == "new_question":

                question = data.get("question")
                choices = data.get("choices")

                room["current_question"] = {
                    "question": question,
                    "choices": choices
                }

                room["votes"] = {0:0,1:0,2:0,3:0}

                await broadcast(room, {
                    "type": "new_question",
                    "question": question,
                    "choices": choices
                })


            # =========================
            # 回答
            # =========================
            if data.get("type") == "answer":

                name = data.get("name")
                choice = data.get("choice")

                if name in room["players"]:

                    room["players"][name]["answer"] = choice
                    room["votes"][choice] += 1

                    await broadcast(room, {
                        "type": "vote_update",
                        "votes": [
                            room["votes"][0],
                            room["votes"][1],
                            room["votes"][2],
                            room["votes"][3]
                        ]
                    })


    except WebSocketDisconnect:

        if websocket in room["connections"]:
            room["connections"].remove(websocket)


# =========================
# Broadcast
# =========================
async def broadcast(room, message):

    for connection in room["connections"]:
        await connection.send_json(message)


# =========================
# Railway / ローカル
# =========================
if __name__ == "__main__":

    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(app, host="0.0.0.0", port=port)

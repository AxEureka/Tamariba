from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


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
        "answers": {}
    }

    return {"room_id": room_id}


# =========================
# ルーム情報取得
# =========================
@app.get("/room/{room_id}")
async def get_room(room_id: str, name: str = ""):

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

    if room_id not in rooms:
        rooms[room_id] = {
            "room": "room",
            "host": "",
            "theme": "mansion",
            "members": [],
            "sockets": [],
            "answers": {}
        }

    room = rooms[room_id]
    room["sockets"].append(websocket)

    try:
        while True:

            data = await websocket.receive_json()
            print("WS受信:", data)
            
            # =========================
            # 新しい問題
            # =========================
            if data.get("type") == "quiz_question":

                room["answers"] = {}

                await broadcast(room, {
                    "type": "quiz_question",
                    "question": data.get("question"),
                    "choices": data.get("choices")
                })

            # =========================
            # 回答
            # =========================
            if data.get("type") == "quiz_answer":

                name = data.get("name")
                choice = data.get("choice")

                if name:
                    room["answers"][name] = choice

                await broadcast(room, {
                    "type": "quiz_votes",
                    "votes": room["answers"]
                })

            # =========================
            # 正解発表
            # =========================
            if data.get("type") == "quiz_correct":

                await broadcast(room, {
                    "type": "quiz_correct",
                    "correct": data.get("correct")
                })

    except WebSocketDisconnect:
        if websocket in room["sockets"]:
            room["sockets"].remove(websocket)


# =========================
# broadcast
# =========================
async def broadcast(room, message):

    for socket in room["sockets"]:
        await socket.send_json(message)


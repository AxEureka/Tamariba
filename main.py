from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

rooms = {}


# =========================
# ルーム作成
# =========================
@app.post("/create_room")
async def create_room():
    room_id = str(uuid.uuid4())[:8]

    rooms[room_id] = {
        "members": [],
        "sockets": [],
        "answers": {}
    }

    return {"room": room_id}


# =========================
# メンバー取得
# =========================
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):

    if room_id not in rooms:
        return JSONResponse({"members": []})

    return {"members": rooms[room_id]["members"]}


# =========================
# WebSocket
# =========================
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):

    await websocket.accept()

    if room_id not in rooms:
        rooms[room_id] = {
            "members": [],
            "sockets": [],
            "answers": {}
        }

    room = rooms[room_id]
    room["sockets"].append(websocket)

    try:
        while True:

            data = await websocket.receive_json()

            # =========================
            # 入室
            # =========================
            if data.get("type") == "join":

                name = data.get("name")

                if name and name not in room["members"]:
                    room["members"].append(name)

                await broadcast(room, {
                    "type": "members",
                    "members": room["members"]
                })


            # =========================
            # 新しい問題
            # =========================
            if data.get("type") == "new_question":

                room["answers"] = {}

                await broadcast(room, {
                    "type": "new_question",   # ←ここ
                    "question": data.get("question"),
                    "choices": data.get("choices")
                })

            # =========================
            # 回答
            # =========================
            if data.get("type") == "answer":

                name = data.get("name")
                choice = data.get("choice")

                if name:
                    room["answers"][name] = choice

                await broadcast(room, {
                    "type": "vote_update",
                    "answers": room["answers"]
                })


            # =========================
            # 正解発表
            # =========================
            if data.get("type") == "show_answer":

                await broadcast(room, {
                    "type": "show_answer",
                    "correct": data.get("correct")
                })


    except WebSocketDisconnect:
        room["sockets"].remove(websocket)


# =========================
# broadcast
# =========================
async def broadcast(room, message):

    for socket in room["sockets"]:
        await socket.send_json(message)


from fastapi import FastAPI
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# static フォルダ公開
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

rooms = {}

# ===== ルート =====
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


# ===== ルーム作成 =====
@app.post("/create_room")
async def create_room(data: dict):
    room_id = str(uuid.uuid4())[:8]

    rooms[room_id] = {
        "host": data["host_name"],
        "room": data["room_name"],
        "theme": data["theme"],
        "members": [data["host_name"]]
    }

    return {"room_id": room_id}


# ===== ルーム情報取得 =====
@app.get("/room/{room_id}")
async def get_room(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)
    return room


# ===== 参加 =====
@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    name = data.get("name")
    if not name:
        return JSONResponse({"error": "name required"}, status_code=400)

    if name not in room["members"]:
        room["members"].append(name)

    return {"members": room["members"]}


# ===== Kick =====
@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    target = data.get("name")
    if not target:
        return JSONResponse({"error": "name required"}, status_code=400)

    if target in room["members"] and target != room["host"]:
        room["members"].remove(target)

    return {"members": room["members"]}


# ===== メンバー一覧 =====
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    return {
        "count": len(room["members"]),
        "members": room["members"]
    }


# ===== Railway / ローカル両対応 =====
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

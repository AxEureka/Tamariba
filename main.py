from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uuid
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

rooms = {}

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

@app.get("/room/{room_id}")
async def get_room(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)
    return room

@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    name = data["name"]
    if name not in room["members"]:
        room["members"].append(name)

    return {"members": room["members"]}

@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    target = data["name"]
    if target in room["members"] and target != room["host"]:
        room["members"].remove(target)

    return {"members": room["members"]}

@app.get("/room/{room_id}/members")
async def get_members(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    return {
        "count": len(room["members"]),
        "members": room["members"]
    }

# ここを追加：Railway 上で直接起動できるように
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))  # Railway の PORT を優先
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

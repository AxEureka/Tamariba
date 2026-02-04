from fastapi import FastAPI
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os

app = FastAPI()

# =============================
# パス設定
# =============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# =============================
# CORS（Railway + ブラウザ用）
# =============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo段階なので全許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# static 公開
# =============================
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# =============================
# ルーム情報（インメモリ）
# =============================
rooms = {}

# =============================
# トップページ（説明 or index.html）
# =============================
@app.get("/", response_class=HTMLResponse)
async def root():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        with open(index_path, encoding="utf-8") as f:
            return f.read()
    return """
    <h1>Tamariba</h1>
    <p>ルーム型リアルタイム講義＋ゲーム空間</p>
    """

# =============================
# ルーム作成
# =============================
@app.post("/create_room")
async def create_room(data: dict):
    room_id = str(uuid.uuid4())[:8]

    rooms[room_id] = {
        "host": data["host_name"],
        "room": data["room_name"],
        "theme": data["theme"],
        "members": [data["host_name"]],
    }

    return {"room_id": room_id}

# =============================
# ルーム情報取得
# =============================
@app.get("/room/{room_id}")
async def get_room(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)
    return room

# =============================
# 参加
# =============================
@app.post("/room/{room_id}/join")
async def join_room(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    name = data["name"]
    if name not in room["members"]:
        room["members"].append(name)

    return {"members": room["members"]}

# =============================
# キック
# =============================
@app.post("/room/{room_id}/kick")
async def kick_member(room_id: str, data: dict):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    target = data["name"]
    if target in room["members"] and target != room["host"]:
        room["members"].remove(target)

    return {"members": room["members"]}

# =============================
# メンバー一覧
# =============================
@app.get("/room/{room_id}/members")
async def get_members(room_id: str):
    room = rooms.get(room_id)
    if not room:
        return JSONResponse({"error": "room not found"}, status_code=404)

    return {
        "count": len(room["members"]),
        "members": room["members"],
    }

# =============================
# Railway 起動用
# =============================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )

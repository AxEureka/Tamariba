from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import uuid
import os
import json
import random
import itertools

app = FastAPI()

# ==================================================
# Static
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)


# ==================================================
# 問題データ読み込み
# ==================================================

def load_json(path):

    try:
        with open(
            path,
            encoding="utf-8"
        ) as f:
            return json.load(f)

    except Exception as e:
        print("読み込み失敗:", path, e)
        return []


COMPATIBILITY_POOL = load_json(
    os.path.join(
        STATIC_DIR,
        "data",
        "compatibility-pool.json"
    )
)


RANKING_POOL = load_json(
    os.path.join(
        STATIC_DIR,
        "data",
        "ranking-question.json"
    )
)


# ==================================================
# Room
# ==================================================

rooms = {}



def create_room_data(
    room_name="room",
    host="",
    theme="mansion"
):

    return {

        "room": room_name,
        "host": host,
        "theme": theme,


        "members": [],
        "sockets": [],


        # ----------------
        # Quiz
        # ----------------

        "answers": {},
        "last_choices": [],
        "scores": {},



        # ----------------
        # NASA
        # ----------------

        "nasa": {},
        "nasa_answers": {},
        "team_answers": {},
        "teams": {},
        "team_count": 0,
        "team_names": [],
        "team_leaders": {},

        # ----------------
        # Compatibility
        # ----------------

        "compatibility": {

            "question_count":0,
            "questions":[],
            "answers":{},
            "groups":{},
            "results":{},
            "similarities":{},
            "teams":{},

            # ranking game
        "ranking_game":{
        
            "mode":"",
            "question_count":0,
        
            "current_index":0,
            "questions":[],
            "current_question":{},
        
            # 追加
            "team_order":[],
            "team_members_order":{},
            "current_team_index":0,
            "current_member_index":{},
        
            "current_answerers":None,
        
            "true_answers":{},
            "predictions":{},
            "scores":{}
        
        }
    }
}

# ==================================================
# Root
# ==================================================

@app.get("/")
async def root():

    return RedirectResponse(
        url="/static/index.html"
    )



# ==================================================
# Room API
# ==================================================

@app.post("/create_room")
async def create_room(data:dict):

    room_id = str(uuid.uuid4())[:8]


    host=data.get("host_name")

    room_name=data.get("room_name")

    theme=data.get(
        "theme",
        "mansion"
    )


    rooms[room_id]=create_room_data(
        room_name,
        host,
        theme
    )


    rooms[room_id]["members"].append(host)


    return {
        "room_id":room_id
    }




@app.get("/room/{room_id}")
async def get_room(room_id:str):

    if room_id not in rooms:

        return JSONResponse(
            {
                "error":"room not found"
            },
            status_code=404
        )


    room=rooms[room_id]


    return {

        "room":room["room"],

        "host":room["host"],

        "theme":room["theme"]

    }



@app.post("/room/{room_id}/join")
async def join_room(
    room_id:str,
    data:dict
):

    if room_id not in rooms:
        return {
            "ok":False
        }


    name=data.get("name")


    if (
        name
        and name not in rooms[room_id]["members"]
    ):
        rooms[room_id]["members"].append(name)



    return {
        "ok":True
    }




@app.get("/room/{room_id}/members")
async def get_members(room_id:str):

    if room_id not in rooms:

        return {
            "members":[],
            "count":0
        }


    members=rooms[room_id]["members"]


    return {

        "members":members,

        "count":len(members)

    }



@app.post("/room/{room_id}/kick")
async def kick_member(
    room_id:str,
    data:dict
):

    name=data.get("name")


    if room_id in rooms:

        if name in rooms[room_id]["members"]:

            rooms[room_id]["members"].remove(name)


    return {
        "ok":True
    }





# ==================================================
# WebSocket
# ==================================================

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket:WebSocket,
    room_id:str
):

    await websocket.accept()


    print(
        "WS接続:",
        room_id
    )



    if room_id not in rooms:

        rooms[room_id]=create_room_data()



    room=rooms[room_id]


    room["sockets"].append(websocket)



    try:

        while True:

            data=await websocket.receive_json()

            msg_type=data.get("type")
            print("受信:", data)



            # ----------------------------
            # Host message
            # ----------------------------

            if msg_type=="host_message":

                text=data.get(
                    "text",
                    ""
                )

                target=data.get(
                    "target"
                )


                if not text:
                    continue



                if target:

                    for socket in room["sockets"]:

                        await socket.send_json(
                            {
                                "type":"host_message",
                                "text":text,
                                "target":target
                            }
                        )


                else:

                    await broadcast(
                        room,
                        {
                            "type":"host_message",
                            "text":text
                        }
                    )



            # ----------------------------
            # Quiz
            # ----------------------------

            elif msg_type.startswith("quiz"):

                await handle_quiz(
                    room,
                    data
                )



            # ----------------------------
            # NASA
            # ----------------------------

            elif (
                msg_type.startswith("nasa")
                or msg_type in [
                    "start_team_phase",
                    "set_team_count",
                    "select_team",
                    "start_leader_phase",
                    "set_team_leader"
                ]
            ):
            
                await handle_nasa(
                    room,
                    data
                )



            # ----------------------------
            # Compatibility
            # ----------------------------

            elif (
                msg_type.startswith("compatibility")
                or msg_type in [
                    "start_compatibility",
                    "end_compatibility"
                ]
            ):

                await handle_compatibility(
                    room,
                    data
                )

            # ----------------------------
            # Ranking
            # ----------------------------

            elif (
                "ranking" in msg_type
            ):

                await handle_ranking(
                    room,
                    data
                )

            elif msg_type=="end_quiz":

                await broadcast(
                    room,
                    {
                        "type":"end_quiz"
                    }
                )


            elif msg_type=="end_nasa":

                await broadcast(
                    room,
                    {
                        "type":"end_nasa"
                    }
                )


            elif msg_type=="end_compatibility":

                await broadcast(
                    room,
                    {
                        "type":"end_compatibility"
                    }
                )



    except WebSocketDisconnect:


        if websocket in room["sockets"]:

            room["sockets"].remove(websocket)


# ==================================================
# Quiz
# ==================================================

async def handle_quiz(room,data):

    msg_type=data.get("type")



    if msg_type=="start_quiz":

        await broadcast(
            room,
            {
                "type":"start_quiz"
            }
        )



    elif msg_type=="quiz_question":

        room["answers"]={}

        choices=data.get(
            "choices",
            []
        )


        room["last_choices"]=choices



        await broadcast(
            room,
            {

                "type":"quiz_question",

                "question":data.get(
                    "question"
                ),

                "choices":choices,

                "timer":data.get(
                    "timer"
                )

            }
        )




    elif msg_type=="quiz_answer":


        name=data.get("name")

        choice=data.get("choice")



        room["answers"][name]=choice



        votes=[
            0
            for _ in room["last_choices"]
        ]



        for v in room["answers"].values():

            if (
                v is not None
                and v < len(votes)
            ):

                votes[v]+=1



        await broadcast(
            room,
            {

                "type":"quiz_show_graph",

                "votes":votes,

                "choices":room["last_choices"]

            }
        )




    elif msg_type=="quiz_score":


        score_map=data.get(
            "scores",
            {}
        )



        for name,choice in room["answers"].items():

            room["scores"].setdefault(
                name,
                0
            )


            room["scores"][name]+=score_map.get(
                str(choice),
                0
            )


        await broadcast(
            room,
            {

                "type":"quiz_score_update",

                "scores":room["scores"]

            }
        )




    elif msg_type=="quiz_correct":

        await broadcast(
            room,
            {

                "type":"quiz_correct",

                "correct":data.get(
                    "correct"
                )

            }
        )




    elif msg_type=="quiz_get_ranking":


        ranking=sorted(
            room["scores"].items(),
            key=lambda x:-x[1]
        )



        await broadcast(
            room,
            {

                "type":"quiz_ranking",

                "ranking":ranking[:5]

            }
        )
# ==================================================
# NASA GAME
# ==================================================

async def handle_nasa(room, data):

    msg_type = data.get("type")


    # ----------------------------------
    # NASA開始
    # ----------------------------------

    if msg_type == "start_nasa":

        room["nasa"] = {

            "items":
                data.get(
                    "items",
                    []
                ),

            "correct":
                data.get(
                    "correct",
                    []
                )
        }


        room["nasa_answers"]={}
        room["team_answers"]={}
        room["team_leaders"]={}



        await broadcast(
            room,
            {

                "type":"start_nasa",

                "items":
                    room["nasa"]["items"]

            }
        )



    # ----------------------------------
    # チーム数設定
    # ----------------------------------

    elif msg_type=="set_team_count":


        room["team_count"]=data.get(
            "count",
            2
        )


        room["team_names"]=data.get(
            "names",
            []
        )



    # ----------------------------------
    # チーム選択開始
    # ----------------------------------

    elif msg_type=="start_team_phase":


        names=room.get(
            "team_names",
            []
        )


        count=room.get(
            "team_count",
            2
        )


        room["teams"]={}


        for i in range(count):

            team_name = (
                names[i]
                if i<len(names)
                else f"チーム{i+1}"
            )


            room["teams"][team_name]=[]



        await broadcast(
            room,
            {

                "type":
                    "team_phase_start",

                "teams":
                    room["teams"]

            }
        )




    # ----------------------------------
    # チーム選択
    # ----------------------------------

    elif msg_type=="select_team":


        name=data.get("name")

        team=data.get("team")



        if team in room["teams"]:


            # 以前の所属解除

            for t in room["teams"]:

                if name in room["teams"][t]:

                    room["teams"][t].remove(name)



            room["teams"][team].append(
                name
            )



        selected=sum(
            len(v)
            for v in room["teams"].values()
        )


        total=len(
            room["members"]
        )



        await broadcast(
            room,
            {

                "type":
                    "team_update",

                "teams":
                    room["teams"],

                "selected":
                    selected,

                "total":
                    total

            }
        )





    # ----------------------------------
    # リーダー選択
    # ----------------------------------

    elif msg_type=="start_leader_phase":


        await broadcast(
            room,
            {

                "type":
                    "leader_phase_start",

                "teams":
                    room["teams"]

            }
        )




    elif msg_type=="set_team_leader":


        team=data.get("team")

        leader=data.get("leader")



        if team:

            room["team_leaders"][team]=leader



        await broadcast(
            room,
            {

                "type":
                    "team_leader_set",

                "team":
                    team,

                "leader":
                    leader

            }
        )





    # ----------------------------------
    # 個人回答
    # ----------------------------------

    elif msg_type=="nasa_personal":


        name=data.get("name")

        ranks=data.get("ranks")



        if (
            not ranks
            or any(
                r is None
                for r in ranks
            )
        ):

            print(
                "不正NASA個人回答:",
                ranks
            )

            return



        room["nasa_answers"][name]={

            "personal":
                ranks

        }



        done=len(
            [
                x
                for x in room["nasa_answers"].values()
                if "personal" in x
            ]
        )



        await broadcast(
            room,
            {

                "type":
                    "nasa_personal_progress",

                "done":
                    done,

                "total":
                    len(room["members"])

            }
        )





    # ----------------------------------
    # チーム回答
    # ----------------------------------

    elif msg_type=="nasa_team":


        team=data.get("team")

        ranks=data.get("ranks")



        if (
            not ranks
            or any(
                r is None
                for r in ranks
            )
        ):

            print(
                "不正NASAチーム回答:",
                ranks
            )

            return



        if team:


            room["team_answers"][team]=ranks



            # メンバーに所属情報付与

            for member in room["teams"].get(
                team,
                []
            ):

                room["nasa_answers"].setdefault(
                    member,
                    {}
                )


                room["nasa_answers"][member][
                    "team_name"
                ]=team



                if "personal" not in room["nasa_answers"][member]:

                    room["nasa_answers"][member][
                        "personal"
                    ]=None




        await broadcast(
            room,
            {

                "type":
                    "nasa_team_progress",

                "done":
                    len(room["team_answers"]),

                "total":
                    len(room["teams"])

            }
        )



        await broadcast(
            room,
            {

                "type":
                    "team_answer_done",

                "team":
                    team

            }
        )

    # ----------------------------------
    # 結果表示
    # ----------------------------------

    elif msg_type=="nasa_show_result":


        await broadcast(
            room,
            {

                "type":
                    "nasa_result",

                "correct":
                    room["nasa"].get(
                        "correct",
                        []
                    ),

                "personal_answers":
                    room["nasa_answers"],

                "team_answers":
                    room["team_answers"]

            }
        )


    # ----------------------------------
    # ランキング取得
    # ----------------------------------

    elif msg_type=="nasa_get_ranking":


        correct=room["nasa"].get(
            "correct",
            []
        )


        my_name=data.get(
            "name"
        )



        personal_scores=[]

        my_personal=None

        my_team=None




        # 個人

        for name,answer in room["nasa_answers"].items():


            if "personal" in answer:


                score=calc_nasa_score(
                    answer["personal"],
                    correct
                )


                personal_scores.append(
                    (
                        name,
                        score
                    )
                )


                if name==my_name:

                    my_personal=score



            if name==my_name:

                my_team=answer.get(
                    "team_name"
                )





        # チーム

        team_scores=[]


        for team,ranks in room["team_answers"].items():


            score=calc_nasa_score(
                ranks,
                correct
            )


            team_scores.append(
                (
                    team,
                    score
                )
            )





        personal_top=make_nasa_rank(
            personal_scores
        )


        team_top=make_nasa_rank(
            team_scores
        )



        my_team_score=next(
            (
                s
                for t,s in team_scores
                if t==my_team
            ),
            None
        )



        diff=None

        if (
            my_personal is not None
            and my_team_score is not None
        ):

            diff=my_personal-my_team_score




        await room_socket_send(
            room,
            my_name,
            {

                "type":
                    "nasa_ranking",

                "personal_top":
                    personal_top,

                "team_top":
                    team_top,

                "my_personal":
                    my_personal,

                "my_team_score":
                    my_team_score,

                "my_diff":
                    diff,

                "my_team_name":
                    my_team

            }
        )

def calc_nasa_score(arr, correct):

    score=0


    for i in range(
        min(
            len(arr),
            len(correct)
        )
    ):

        if arr[i] is None:
            continue


        score += abs(
            int(arr[i])
            -
            correct[i]
        )


    return score




def make_nasa_rank(scores):

    result=[]


    for rank,(name,score) in enumerate(
        sorted(
            scores,
            key=lambda x:x[1]
        ),
        start=1
    ):

        if rank>3:
            break


        result.append(
            {
                "name":name,
                "score":score,
                "rank":rank
            }
        )


    return result

# ==================================================
# Compatibility
# ==================================================

async def handle_compatibility(room,data):

    msg_type=data.get("type")


    # ----------------------------------
    # 開始
    # ----------------------------------

    if msg_type=="start_compatibility":

        print("start_compatibility受信")
        print(
            "COMPATIBILITY_POOL数:",
            len(COMPATIBILITY_POOL)
        )

        question_count=data.get(
            "question_count",
            10
        )


        if not COMPATIBILITY_POOL:

            print("COMPATIBILITY_POOLが空です")
        
            await broadcast(
                room,
                {
                    "type":"error",
                    "message":"問題データなし"
                }
            )
        
            return
            


        questions=random.sample(
            COMPATIBILITY_POOL,
            min(
                question_count,
                len(COMPATIBILITY_POOL)
            )
        )


        room["compatibility"]={

            "question_count":
                len(questions),

            "questions":
                questions,

            "answers":{},

            "groups":{},

            "results":{},

            "similarities":{},

            "teams":{},

            "ranking_game":
                room["compatibility"].get(
                    "ranking_game",
                    {}
                )

        }

        print(
            "問題送信:",
            len(questions)
        )



        await broadcast(
            room,
            {
                "type":
                    "start_compatibility",

                "questions":
                    questions
            }
        )

    # ----------------------------------
    # 回答保存
    # ----------------------------------

    elif msg_type=="compatibility_answer":


        name=data.get("name")

        answers=data.get(
            "answers",
            []
        )


        if name in room["compatibility"]["answers"]:

            return



        room["compatibility"]["answers"][name]=answers



        done=len(
            room["compatibility"]["answers"]
        )

        total=len(
            room["members"]
        )-1



        await broadcast(
            room,
            {

                "type":
                    "compatibility_progress",

                "done":
                    done,

                "total":
                    total

            }
        )



        if done>=total:


            players=list(
                room["compatibility"]["answers"].keys()
            )


            similarities={}



            for i in range(len(players)):

                for j in range(
                    i+1,
                    len(players)
                ):

                    p1=players[i]

                    p2=players[j]


                    a1=room["compatibility"]["answers"][p1]

                    a2=room["compatibility"]["answers"][p2]



                    same=sum(
                        x==y
                        for x,y in zip(a1,a2)
                    )


                    rate=round(
                        same/len(a1)*100,
                        1
                    )


                    similarities[
                        f"{p1}|{p2}"
                    ]=rate



            room["compatibility"]["similarities"]=similarities



            await broadcast(
                room,
                {

                    "type":
                        "compatibility_all_done",

                    "player_count":
                        len(players)

                }
            )


    # ----------------------------------
    # チーム作成
    # ----------------------------------

    elif msg_type=="compatibility_make_team":

        print("compatibility_make_team受信")
        print(data)

        similarities = room["compatibility"]["similarities"]
    
        players = list(
            room["compatibility"]["answers"].keys()
        )
    
    
        team_count = data.get(
            "team_count",
            4
        )

        high_count = data.get(
            "high_team_count",
            2
        )
        
        low_count = data.get(
            "low_team_count",
            2
        )
        
        actual_team_count = (
            high_count +
            low_count
        )
        
        # ------------------
        # チーム人数配分
        # ------------------
        
        team_sizes = []
        
        base = len(players) // actual_team_count
        rest = len(players) % actual_team_count
        
        for i in range(actual_team_count):
        
            team_sizes.append(
                base + (
                    1 if i < rest
                    else 0
                )
            )  
        # -------------------------
        # 類似度取得
        # -------------------------
    
        def sim(a,b):
    
            return similarities.get(
                f"{a}|{b}",
                similarities.get(
                    f"{b}|{a}",
                    0
                )
            )
    
    
        # -------------------------
        # チーム作成
        # -------------------------
    
        teams={}
    
    
        unused=set(players)


        # =========================
        # 偽フィードバック準備
        # =========================
        
        fake_pattern = [90,20]
        
        
        high_fake_scores = [
            fake_pattern[i % 2]
            for i in range(high_count)
        ]
        
        random.shuffle(high_fake_scores)
        
        
        
        low_fake_scores = [
            fake_pattern[i % 2]
            for i in range(low_count)
        ]
        
        random.shuffle(low_fake_scores)    
    
        # =========================
        # 高類似チーム
        # =========================
    
        for i in range(high_count):
    
            team=[]
    
    
            # 一番似ているペアを探す
    
            best_pair=None
            best_score=-1
    
    
            for a,b in itertools.combinations(
                unused,
                2
            ):
    
                score=sim(a,b)
    
                if score>best_score:
    
                    best_score=score
                    best_pair=(a,b)
    
    
    
            if best_pair:
    
                team=list(best_pair)
    
                unused.remove(team[0])
                unused.remove(team[1])
    
    
            # 人数調整
    
            while len(team) < team_sizes[i]:
    
                if not unused:
                    break
    
    
                candidate=max(
                    unused,
                    key=lambda x:
                        sum(
                            sim(x,t)
                            for t in team
                        )
                )
    
    
                team.append(candidate)
                unused.remove(candidate)
    
    
    
            teams[
                f"チーム{i+1}"
            ]={
            
                "members":team,
            
                # 実際の類似度条件
                "type":"high",
            
                # 実際の一致率
                "score":round(
                    sum(
                        sim(a,b)
                        for a,b in itertools.combinations(team,2)
                    )
                    /
                    max(
                        1,
                        len(list(itertools.combinations(team,2)))
                    ),
                    1
                ),
            
                # 偽フィードバック
                "shown_score":
                     high_fake_scores[i]
            
            }
    
    
        # =========================
        # 低類似チーム
        # =========================
    
        for i in range(low_count):
    
            team=[]
    
    
            best_pair=None
            best_score=999
    
    
            for a,b in itertools.combinations(
                unused,
                2
            ):
    
                score=sim(a,b)
    
    
                if score<best_score:
    
                    best_score=score
                    best_pair=(a,b)
    
    
    
            if best_pair:
    
                team=list(best_pair)
    
                unused.remove(team[0])
                unused.remove(team[1])
    
    
    
            while len(team) < team_sizes[high_count+i]:
    
                if not unused:
                    break
    
    
                candidate=min(
                    unused,
                    key=lambda x:
                        sum(
                            sim(x,t)
                            for t in team
                        )
                )
    
    
                team.append(candidate)
    
                unused.remove(candidate)
    
    
    
            index=high_count+i+1
    
    
            teams[
                f"チーム{index}"
            ]={
            
                "members":team,
            
                # 実際の類似度条件
                "type":"low",
            
                # 実際の一致率
                "score":round(
                    sum(
                        sim(a,b)
                        for a,b in itertools.combinations(team,2)
                    )
                    /
                    max(
                        1,
                        len(list(itertools.combinations(team,2)))
                    ),
                    1
                ),
            
                # 偽フィードバック
                "shown_score":
                    low_fake_scores[i]
            
            }
    
        # -------------------------
        # 保存
        # -------------------------
    
        room["compatibility"]["teams"]=teams
    
    
    
        await broadcast(
            room,
            {
                "type":
                    "compatibility_team_created",
    
                "teams":
                    teams
            }
        )
    # ----------------------------------
    # 偽結果
    # ----------------------------------

    elif msg_type=="show_fake_compatibility":


        await broadcast(
            room,
            {

                "type":
                    "fake_compatibility_result",

                "teams":
                    room["compatibility"].get(
                        "teams",
                        {}
                    )

            }
        )


# ==================================================
# Compatibility Team
# ==================================================

async def make_compatibility_team(room,data):

    similarities=room["compatibility"].get(
        "similarities",
        {}
    )


    players=list(
        room["compatibility"]["answers"].keys()
    )


    size=data.get(
        "team_size",
        4
    )


    team_count=max(
        1,
        round(
            len(players)/size
        )
    )


    random.shuffle(players)


    teams={}



    for i,p in enumerate(players):

        name=f"チーム{i%team_count+1}"


        teams.setdefault(
            name,
            {
                "members":[],
                "score":0,
                "shown_score":0
            }
        )


        teams[name]["members"].append(p)



    for name,team in teams.items():

        scores=[]

        members=team["members"]


        for i in range(len(members)):

            for j in range(
                i+1,
                len(members)
            ):

                key=f"{members[i]}|{members[j]}"

                scores.append(
                    similarities.get(
                        key,
                        0
                    )
                )


        team["score"]=round(
            sum(scores)/len(scores),
            1
        ) if scores else 100



    room["compatibility"]["teams"]=teams



    await broadcast(
        room,
        {

            "type":
                "compatibility_team_created",

            "teams":
                teams

        }
    )


# ==================================================
# Ranking Game
# ==================================================

async def handle_ranking(room,data):

    msg_type=data.get("type")
    print("判定:", msg_type)


    game=room["compatibility"]["ranking_game"]



    if msg_type=="start_ranking_game":

        count=data.get(
            "question_count",
            5
        )
    
        questions=random.sample(
            RANKING_POOL,
            min(
                count,
                len(RANKING_POOL)
            )
        )
    
    
        # ==========================
        # チーム内ローテーション準備
        # ==========================
    
        teams = room["compatibility"]["teams"]

        print("ランキング開始時teams:")
        for t,v in teams.items():
            print(t, v["members"])
        
        team_order = [
            t for t,v in teams.items()
            if len(v.get("members",[])) > 0
        ]
        
        print("team_order:", team_order)
    
    
        team_members_order = {}
    
        current_member_index = {}
    
    
        for team,info in teams.items():
    
            members = info["members"].copy()
    
            # チーム内順番をランダム化
            random.shuffle(members)
    
            team_members_order[team] = members
    
            current_member_index[team] = 0
    
    
    
        room["compatibility"]["ranking_game"]={

            "mode":"answering",
        
            "questions":questions,
        
            "current_index":0,
        
            "team_order":team_order,
        
            "team_members_order":team_members_order,
        
            "current_team_index":0,
        
            "current_member_index":current_member_index,
        
            "current_answerers":{},
        
        
            "true_answers":{},
            "predictions":{},
            "scores":{},
            "prediction_done":{},
            "answer_done":{}
        
        }

        print(
            "ranking questions:",
            len(questions)
        )
        
        print(
            "teams:",
            teams
        )
        
        await start_next_ranking_question(
            room
        )



    elif msg_type=="ranking_answer":
    
        name=data.get("name")
        ranking=data.get("ranking")
        target=data.get("target")
    
        index=game["current_index"]-1
    
    
        if data.get("answer_type")=="true":
    
            game["true_answers"].setdefault(
                index,
                {}
            )
    
            game["true_answers"][index][name]=ranking
    
    
            done_count=len(
                game["true_answers"][index]
            )
    
            need_count=len(
                game["current_answerers"]
            )
    
    
            if done_count >= need_count:

                game["mode"]="prediction"
            
            
                await broadcast(
                    room,
                    {
                        "type":
                            "ranking_prediction_start",
                
                        "answerers":
                            game["current_answerers"],
                
                        "question":
                            game["current_question"],
                
                        "players":
                            list(room["members"])
                    }
                )
    
    
        else:

            game["predictions"].setdefault(
                name,
                {}
            )
        
            game["predictions"][name].setdefault(
                index,
                {}
            )
        
            game["predictions"][name][index][target]=ranking
        
        
        
            # =====================
            # 回答者完了チェック
            # =====================
        
            team = None

            for t, members in room["compatibility"]["teams"].items():
            
                if name in members["members"]:
                    team = t
                    break        
        
        
            if team:
        
        
                answerer = game["current_answerers"][team]
        
        
                # 自分のチーム代表以外の人数
                members = room["compatibility"]["teams"][team]["members"]
        
                need = len(members)-1
        
        
                done = len(
                    game["predictions"][name][index]
                )
        
        
                if done >= need:
        
                    game["prediction_done"][name]=True
        
        
        
            # 全員完了確認

            total_done = len(
                game["prediction_done"]
            )
            
            
            # 実際に予想する人
            answerers = set(
                game["current_answerers"].values()
            )
            
            
            predictors = [
                name
                for name in room["members"]
                if name not in answerers
            ]
            
            
            total_need = len(predictors)
            
            
            await broadcast(
                room,
                {
                    "type":
                        "ranking_prediction_progress",
            
                    "done":
                        total_done,
            
                    "total":
                        total_need
                }
            )
            
            
            if total_done >= total_need:

                game["mode"]="result"
            
                await broadcast(
                    room,
                    {
                        "type":"ranking_prediction_complete"
                    }
                )




    elif msg_type=="start_ranking_prediction":

        game["mode"]="prediction"
    
    
        await broadcast(
            room,
            {
                "type":
                    "ranking_prediction_start",
    
                "answerers":
                    game["current_answerers"],
    
                "question":
                    game["current_question"]
            }
        )


    elif msg_type=="ranking_check":


        scores={}
    
    
        for player,questions in game["predictions"].items():
    
            score=0
    
    
            for q_index,targets in questions.items():
    
                for target,predict in targets.items():
    
                    answer = (
                        game["true_answers"]
                        [q_index]
                        .get(target)
                    )
    
    
                    if answer:
    
                        score += calc_sanrentan(
                            answer,
                            predict
                        )
    
    
            scores[player]=score
    
    
    
        game["scores"]=scores
    
    
    
        await broadcast(
            room,
            {
                "type":"ranking_result",
    
                "true_answers":
                    game["true_answers"],
    
                "predictions":
                    game["predictions"],
    
                "scores":
                    scores
            }
        )




    elif msg_type=="ranking_final":


        result=sorted(
            game["scores"].items(),
            key=lambda x:-x[1]
        )


        await broadcast(
            room,
            {

                "type":
                    "ranking_final_result",

                "ranking":
                    result

            }
        )

    elif msg_type=="ranking_score":


        game=room["compatibility"]["ranking_game"]


        scores={}


        for player,questions in game["predictions"].items():

            score=0
                
            for q_index,targets in questions.items():
        
                for target,predict in targets.items():
        
                    answer = game["true_answers"][q_index].get(target)
        
                    if answer:
        
                        score += calc_sanrentan(
                            answer,
                            predict
                        )

            scores[player]=score


        game["scores"]=scores



        await broadcast(
            room,
            {
                "type":"ranking_score_result",
                "scores":scores
            }
        )

    
    elif msg_type=="ranking_next_question":

        game["predictions"]={}
        game["prediction_done"]={}
        game["answer_done"]={}
        game["current_answerers"]={}
    
        await start_next_ranking_question(room)



# ==================================================
# Ranking next question
# ==================================================

async def start_next_ranking_question(room):

    game=room["compatibility"]["ranking_game"]

    index=game["current_index"]

    if index>=len(game["questions"]):
        await broadcast(
            room,
            {
                "type":"ranking_game_end"
            }
        )
        return

    question=game["questions"][index]

    answerers={}

    # 全チームから1人ずつ選ぶ
    for team in game["team_order"]:

        members = game["team_members_order"].get(team, [])
    
        if not members:
            continue
    
        member_index = game["current_member_index"][team]
    
        answerer = members[member_index]
        answerers[team]=answerer

        game["current_member_index"][team]+=1

        if game["current_member_index"][team]>=len(members):
            game["current_member_index"][team]=0


    game["current_answerers"]=answerers


    game["true_answers"][index]={}


    game["current_question"]=question


    game["current_index"]+=1



    await broadcast(
        room,
        {
            "type":"ranking_question",
    
            "question":
                question,
    
            "players":
                list(
                    room["compatibility"]["answers"].keys()
                ),
    
            "answerers":
                answerers,
    
            "mode":
                "answering"
        }
    )
    
    
# ==================================================
# Common
# ==================================================

async def room_socket_send(room,name,message):

    for socket in room["sockets"]:

        try:

            await socket.send_json(
                message
            )

        except:

            pass




async def broadcast(room,message):

    dead=[]


    for socket in room["sockets"]:

        try:

            await socket.send_json(
                message
            )

        except:

            dead.append(socket)



    for socket in dead:

        if socket in room["sockets"]:

            room["sockets"].remove(socket)


def calc_sanrentan(answer, predict):

    # =========================
    # 7択完全一致ボーナス
    # =========================

    if answer == predict:
        return 15


    # =========================
    # 上位3位判定
    # =========================

    answer_top3 = answer[:3]
    predict_top3 = predict[:3]


    exact = 0
    hit = 0


    for i in range(3):

        if answer_top3[i] == predict_top3[i]:
            exact += 1


        if predict_top3[i] in answer_top3:
            hit += 1



    # サンレンタン
    if exact == 3:
        return 6

    # サンレンプク
    elif hit == 3:
        return 4

    # ニレンタン
    elif exact == 2:
        return 3

    # プクプク
    elif hit == 2:
        return 2

    # タン
    elif hit == 1:
        return 1

    else:
        return 0

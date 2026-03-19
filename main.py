# =========================
# ランキング
# =========================
            elif msg_type == "nasa_get_ranking":

                correct = room["nasa"].get("correct", [])
                my_name = data.get("name")

                def calc(arr):
                    if not arr or not correct:
                        return 0
                    return sum(abs(arr[i] - correct[i]) for i in range(min(len(arr), len(correct))))

                personal_scores = []
                team_scores = {}

                my_personal = None
                my_team = None

                for name, a in room["nasa_answers"].items():

                    # 個人
                    if "personal" in a:
                        s = calc(a["personal"])
                        personal_scores.append((name, s))

                        if name == my_name:
                            my_personal = s

                    # チーム
                    if "team" in a:
                        t = a.get("team_name", "チーム")
                        s = calc(a["team"])
                        team_scores.setdefault(t, []).append(s)

                        if name == my_name:
                            my_team = t

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

                await broadcast(room, {
                    "type": "nasa_ranking",
                    "personal_top": [{"name": n, "score": s} for n, s in personal_scores[:3]],
                    "personal_avg": round(personal_avg, 1),
                    "team_top": [{"name": n, "score": round(s, 1)} for n, s in team_top],
                    "team_avg": round(team_avg, 1),
                    "my_personal": my_personal,
                    "my_team": my_team
                })

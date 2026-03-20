function showControl(){

  container.innerHTML=`
    <div class="nasa-ui">
      <h2>NASAゲーム進行</h2>

      <button id="startTeam">チーム回答開始</button>
      <button id="startLeader">リーダー選択開始</button>
      <button id="showResult">正解発表</button>
      <button id="showRanking">ランキング</button>
    </div>
  `;

  document.getElementById("startTeam").onclick=()=>{
    socket.send(JSON.stringify({
      type:"start_team_phase"
    }));
  };

  document.getElementById("startLeader").onclick=()=>{
    socket.send(JSON.stringify({
      type:"start_leader_phase"
    }));
  };

  document.getElementById("showResult").onclick=()=>{
    socket.send(JSON.stringify({type:"nasa_show_result"}));
  };

  document.getElementById("showRanking").onclick=()=>{
    socket.send(JSON.stringify({
      type:"nasa_get_ranking",
      name: window.myName || "host"
    }));
  };

}

import { createItemEditor } from "./nasa-ui.js";

let socket;
let container;

export function startNASAHost(ws, uiContainer) {
  socket = ws;
  container = uiContainer;

  createItemEditor(container, (items, correct) => {
    // 親が品目と正解順位を設定したら送信
    socket.send(JSON.stringify({
      type: "nasa_start",
      items: items,
      correct: correct
    }));
  });
}

import { createItemEditor } from "./nasa-ui.js";

let socket;
let container;

export function startNASAHost(ws, uiContainer) {
  socket = ws;
  container = uiContainer;

  // 親画面で品目と正解設定
  createItemEditor(container, (items, correct) => {
    socket.send(JSON.stringify({
      type: "nasa_start",
      items: items,
      correct: correct
    }));
  });
}

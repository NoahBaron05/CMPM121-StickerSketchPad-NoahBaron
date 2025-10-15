import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
`;

const canvas = document.createElement("canvas")!;
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const clearButton = document.createElement("button");
clearButton.id = "clear";
clearButton.textContent = "Clear";
document.body.append(clearButton);
const cursor = { active: false, x: 0, y: 0 };

//Stroke setup
type Point = { x: number; y: number };
let strokes: Point[][] = [];
let currentStroke: Point[] = [];

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  currentStroke = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  if (currentStroke.length > 0) {
    strokes.push(currentStroke);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    currentStroke.push({ x: e.offsetX, y: e.offsetY });
    canvas.dispatchEvent(new Event("drawing-changed"));
  }
});

clearButton.addEventListener("click", () => {
  strokes = [];
  currentStroke = [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  strokes.push(currentStroke);

  strokes.forEach((stroke) => {
    ctx.beginPath();

    for (let i = 1; i < stroke.length; i++) {
      const p1 = stroke[i - 1];
      const p2 = stroke[i];
      if (!p1 || !p2) continue;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }

    ctx.stroke();
  });
});

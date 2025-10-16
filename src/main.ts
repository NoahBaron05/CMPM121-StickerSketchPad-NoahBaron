import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
`;

//Canvas setup
const canvas = document.createElement("canvas")!;
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

document.body.append(document.createElement("br"));

//Clear button setup
const clearButton = document.createElement("button");
clearButton.id = "clear";
clearButton.textContent = "Clear";
document.body.append(clearButton);
const cursor = { active: false, x: 0, y: 0 };

//Undo/redo button setup
const undoButton = document.createElement("button");
undoButton.id = "undo";
undoButton.textContent = "Undo";
document.body.append(undoButton);

const redoButton = document.createElement("button");
redoButton.id = "redo";
redoButton.textContent = "Redo";
document.body.append(redoButton);

//Stroke setup
/*type Point = { x: number; y: number };
let strokes: Point[][] = [];
let currentStroke: Point[] = [];
let undoList: Point[][] = [];
*/

//Command interface setup
interface Renderable {
  display(ctx: CanvasRenderingContext2D): void;
}

type Point = { x: number; y: number };

class LineStroke implements Renderable {
  private points: Point[] = [];

  constructor(startX: number, startY: number) {
    this.points.push({ x: startX, y: startY });
  }

  drag(newX: number, newY: number) {
    this.points.push({ x: newX, y: newY });
  }

  display(ctx: CanvasRenderingContext2D): void {
    if (this.points.length < 2) return;

    ctx.beginPath();

    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      if (!p1 || !p2) continue;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }

    ctx.stroke();
  }
}

let strokes: Renderable[] = [];
let currentStroke: LineStroke | null = null;
let undoList: Renderable[] = [];

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  currentStroke = new LineStroke(e.offsetX, e.offsetY);
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  if (!currentStroke) return;

  strokes.push(currentStroke);
  currentStroke = null;
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active || !currentStroke) return;

  currentStroke.drag(e.offsetX, e.offsetY);
  canvas.dispatchEvent(new Event("drawing-changed"));
});

clearButton.addEventListener("click", () => {
  strokes = [];
  currentStroke = null;
  undoList = [];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

undoButton.addEventListener("click", () => {
  if (strokes.length < 1) return;

  const lastStroke = strokes.pop()!;
  undoList.push(lastStroke);

  canvas.dispatchEvent(new Event("drawing-changed"));
});

redoButton.addEventListener("click", () => {
  if (undoList.length < 1) return;

  const redoStroke = undoList.pop()!;
  strokes.push(redoStroke);

  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((s) => s.display(ctx));
  if (currentStroke) currentStroke.display(ctx);
});

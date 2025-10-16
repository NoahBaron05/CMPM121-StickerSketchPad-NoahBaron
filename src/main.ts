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

//Thin/thick marker setup
document.body.append(document.createElement("br"));
document.body.append(document.createElement("br"));

const thinButton = document.createElement("button");
thinButton.id = "thin";
thinButton.textContent = "Thin";
document.body.append(thinButton);

const thickButton = document.createElement("button");
thickButton.id = "thick";
thickButton.textContent = "Thick";
document.body.append(thickButton);

//Command interface setup
interface Renderable {
  display(ctx: CanvasRenderingContext2D): void;
}

interface ActiveStroke extends Renderable {
  drag(x: number, y: number): void;
}

function createLineStroke(
  startX: number,
  startY: number,
  thickness: number,
): ActiveStroke {
  const points = [{ x: startX, y: startY }];
  const strokeThickness = thickness;

  return {
    drag(newX: number, newY: number) {
      points.push({ x: newX, y: newY });
    },

    display(ctx: CanvasRenderingContext2D): void {
      if (points.length < 2) return;

      ctx.lineWidth = strokeThickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }

      ctx.stroke();
    },
  };
}

let strokes: Renderable[] = [];
let currentStroke: ActiveStroke | null = null;
let lineThickness = 1;
let undoList: Renderable[] = [];

function startStroke(x: number, y: number) {
  currentStroke = createLineStroke(x, y, lineThickness);
}

function continueStroke(x: number, y: number) {
  if (currentStroke) currentStroke.drag(x, y);
}

function endStroke() {
  if (!currentStroke) return;
  strokes.push(currentStroke);
  currentStroke = null;
}

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  startStroke(e.offsetX, e.offsetY);
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  endStroke();
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  if (!cursor.active) return;
  continueStroke(e.offsetX, e.offsetY);
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

thinButton.addEventListener("click", () => {
  lineThickness = 1;
});

thickButton.addEventListener("click", () => {
  lineThickness = 6;
});

canvas.addEventListener("drawing-changed", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((s) => s.display(ctx));
  if (currentStroke) currentStroke.display(ctx);
});

import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
`;

//Canvas setup
const canvas = document.createElement("canvas")!;
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
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

//Sticker Setup
document.body.append(document.createElement("br"));
document.body.append(document.createElement("br"));

const stickerButton1 = document.createElement("button");
stickerButton1.id = "sticker1";
stickerButton1.textContent = "🚒";
document.body.append(stickerButton1);

const stickerButton2 = document.createElement("button");
stickerButton2.id = "sticker2";
stickerButton2.textContent = "🙄";
document.body.append(stickerButton2);

const stickerButton3 = document.createElement("button");
stickerButton3.id = "sticker3";
stickerButton3.textContent = "🎃";
document.body.append(stickerButton3);

//Drawing Configuration
const DrawingConfig = {
  thickness: 2,
};

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
): ActiveStroke {
  const points = [{ x: startX, y: startY }];
  const thickness = DrawingConfig.thickness;

  return {
    drag(newX: number, newY: number) {
      points.push({ x: newX, y: newY });
    },

    display(ctx: CanvasRenderingContext2D): void {
      if (points.length < 2) return;

      ctx.lineWidth = thickness;
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

interface ToolPreview extends Renderable {}

const ToolConfig = {
  symbol: "*",
};

function createToolPreview(x: number, y: number): ToolPreview {
  const thickness = DrawingConfig.thickness;
  const symbol = ToolConfig.symbol;
  return {
    display(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.font = `${thickness * 10}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.fillText(symbol, x, y + (3 * thickness));
      ctx.restore();
    },
  };
}

function createStickerPreview(x: number, y: number): Renderable {
  const emoji = StickerConfig.emoji;
  return {
    display(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, x, y);
      ctx.restore();
    },
  };
}

function createSticker(x: number, y: number): ActiveStroke {
  const emoji = StickerConfig.emoji;
  const pos = { x, y };

  return {
    drag(newX: number, newY: number) {
      pos.x = newX;
      pos.y = newY; // just reposition, not record path
    },
    display(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, pos.x, pos.y);
      ctx.restore();
    },
  };
}

const StickerConfig = {
  active: false,
  emoji: "",
};

let strokes: Renderable[] = [];
let currentStroke: ActiveStroke | null = null;
let undoList: Renderable[] = [];
let toolPreview: ToolPreview | null = null;

function startStroke(x: number, y: number) {
  if (StickerConfig.active) {
    currentStroke = createSticker(x, y);
  } else {
    currentStroke = createLineStroke(x, y);
  }
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
  if (StickerConfig.active) StickerConfig.active = false;
  cursor.active = false;
  endStroke();
  canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
  toolPreview = createToolPreview(e.offsetX, e.offsetY);

  if (cursor.active) {
    continueStroke(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("drawing-changed"));
  } else {
    if (StickerConfig.active) {
      toolPreview = createStickerPreview(e.offsetX, e.offsetY);
    } else {
      toolPreview = createToolPreview(e.offsetX, e.offsetY);
    }
    canvas.dispatchEvent(new Event("tool-moved"));
  }
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  endStroke();
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
  DrawingConfig.thickness = 2;
});

thickButton.addEventListener("click", () => {
  DrawingConfig.thickness = 6;
});

stickerButton1.addEventListener("click", () => {
  StickerConfig.active = true;
  StickerConfig.emoji = stickerButton1.textContent;
  canvas.dispatchEvent(new Event("tool-moved"));
});

stickerButton2.addEventListener("click", () => {
  StickerConfig.active = true;
  StickerConfig.emoji = stickerButton2.textContent;
  canvas.dispatchEvent(new Event("tool-moved"));
});

stickerButton3.addEventListener("click", () => {
  StickerConfig.active = true;
  StickerConfig.emoji = stickerButton3.textContent;
  canvas.dispatchEvent(new Event("tool-moved"));
});

canvas.addEventListener("drawing-changed", () => {
  redraw();
});

canvas.addEventListener("tool-moved", () => {
  redraw();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach((s) => s.display(ctx));
  if (currentStroke) currentStroke.display(ctx);
  if (toolPreview) toolPreview.display(ctx);
}

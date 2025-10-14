import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sketchpad</h1>
`;

const canvas = document.createElement("canvas")!;
canvas.width = 256;
canvas.height = 256;
document.body.append(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const cursor = { active: false, x: 0, y: 0 };

addEventListener("mousedown", (mouse) => {
  cursor.x = mouse.offsetX;
  cursor.y = mouse.offsetY;
  cursor.active = true;
});

addEventListener("mouseup", () => {
  cursor.active = false;
});

addEventListener("mousemove", (mouse) => {
  if (cursor.active) {
    drawLine(ctx, cursor.x, cursor.y, mouse.offsetX, mouse.offsetY);
  }
});

function drawLine(
  context: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  cursor.x = x2;
  cursor.y = y2;
}

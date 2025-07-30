// canvasLogic.js

// Constante pentru unelte
export const TOOL_PENCIL = "pencil";
export const TOOL_BRUSH = "brush";
export const TOOL_PEN = "pen";
export const TOOL_ERASER = "eraser";
export const TOOL_BUCKET = "bucket";

// Conversie hex în RGBA
export function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
    Math.round(alpha * 255),
  ];
}

// Compară două culori RGBA
export function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

// Flood Fill pentru găleată
export function floodFill(imageData, x, y, fillColor) {
  const { data, width, height } = imageData;
  const stack = [[x, y]];
  const startIndex = (y * width + x) * 4;
  const targetColor = [
    data[startIndex],
    data[startIndex + 1],
    data[startIndex + 2],
    data[startIndex + 3],
  ];

  if (colorMatch(targetColor, fillColor)) return;

  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const i = (cy * width + cx) * 4;
    const current = [data[i], data[i+1], data[i+2], data[i+3]];
    if (!colorMatch(current, targetColor)) continue;
    data[i] = fillColor[0];
    data[i+1] = fillColor[1];
    data[i+2] = fillColor[2];
    data[i+3] = fillColor[3];
    stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
  }
}

// Undo
export function handleUndo(
  history,
  currentCanvasDataUrl,
  setHistory,
  setRedoStack,
  setCurrentCanvasDataUrl,
  konvaDrawingImageRef
) {
  if (history.length === 0) return;
  const prev = history[history.length - 1];
  setRedoStack(prevRedo => [currentCanvasDataUrl, ...prevRedo]);
  setCurrentCanvasDataUrl(prev);
  konvaDrawingImageRef.current.src = prev;
  setHistory(prevHist => prevHist.slice(0, -1));
}

// Redo
export function handleRedo(
  redoStack,
  currentCanvasDataUrl,
  setHistory,
  setRedoStack,
  setCurrentCanvasDataUrl,
  konvaDrawingImageRef
) {
  if (redoStack.length === 0) return;
  const [next, ...rest] = redoStack;
  setHistory(prev => [...prev, currentCanvasDataUrl]);
  setCurrentCanvasDataUrl(next);
  konvaDrawingImageRef.current.src = next;
  setRedoStack(rest);
}

// Reset canvas
export function handleReset(
  setCurrentCanvasDataUrl,
  setHistory,
  setRedoStack,
  konvaDrawingImageRef
) {
  setCurrentCanvasDataUrl("");
  setHistory([]);
  setRedoStack([]);
  konvaDrawingImageRef.current = new window.Image();
}

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";

// --- Configurație & funcții ajutătoare ---
const steps = [
  {
    title: "Pasul 1: Forma feței",
    description: "Începe prin a trasa un oval pentru forma generală a capului.",
    image: "/imagini/step1.gif",
  },
  // ... alte imagini dacă este nevoie
];

const TOOL_PENCIL = "pencil";
const TOOL_BRUSH = "brush";
const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const TOOL_BUCKET = "bucket";

function useImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
  }, [url]);
  return image;
}

// --- Geometrie pentru radieră ---
function segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

function eraseAtPosition(linesArray, cx, cy, r) {
  function pointInCircle(x, y, cx, cy, r) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function segmentCircleIntersection(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return [];
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    const ts = [];
    if (t1 >= 0 && t1 <= 1) ts.push(t1);
    if (t2 >= 0 && t2 <= 1) ts.push(t2);
    return ts;
  }

  const newLines = [];
  linesArray.forEach((line) => {
    // Nu ștergem obiecte de tip 'bucketFill' cu radiera
    if (line.type === 'bucketFill') {
      newLines.push(line);
      return;
    }

    const pts = line.points;
    let currentSegment = [];
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i];
      const y1 = pts[i + 1];
      const x2 = pts[i + 2];
      const y2 = pts[i + 3];
      const p1In = pointInCircle(x1, y1, cx, cy, r);
      const p2In = pointInCircle(x2, y2, cx, cy, r);
      const intersections = segmentCircleIntersection(x1, y1, x2, y2, cx, cy, r);

      if (!p1In && !p2In && intersections.length === 0) {
        if (currentSegment.length === 0) currentSegment.push(x1, y1);
        currentSegment.push(x2, y2);
      } else if (!p1In && p2In && intersections.length > 0) {
        const t = Math.min(...intersections);
        const ix = lerp(x1, x2, t);
        const iy = lerp(y1, y2, t);
        if (currentSegment.length === 0) currentSegment.push(x1, y1);
        currentSegment.push(ix, iy);
        newLines.push({ ...line, points: [...currentSegment] });
        currentSegment = [];
      } else if (p1In && !p2In && intersections.length > 0) {
        const t = Math.max(...intersections);
        const ix = lerp(x1, x2, t);
        const iy = lerp(y1, y2, t);
        currentSegment = [ix, iy, x2, y2];
      } else if (!p1In && !p2In && intersections.length === 2) {
        const tA = Math.min(...intersections);
        const tB = Math.max(...intersections);
        const ixA = lerp(x1, x2, tA);
        const iyA = lerp(y1, y2, tA);
        const ixB = lerp(x1, x2, tB);
        const iyB = lerp(y1, y2, tB);
        if (currentSegment.length === 0) currentSegment.push(x1, y1);
        currentSegment.push(ixA, iyA);
        newLines.push({ ...line, points: [...currentSegment] });
        currentSegment = [ixB, iyB, x2, y2];
      } else {
        if (currentSegment.length >= 4) {
          newLines.push({ ...line, points: [...currentSegment] });
        }
        currentSegment = [];
      }
    }
    if (currentSegment.length >= 4) {
      newLines.push({ ...line, points: [...currentSegment] });
    }
  });
  return newLines;
}

// --- Funcții ajutătoare pentru bucket fill ---
function hexToRgba(hex) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255, 255];
}
function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function floodFill(imageData, x, y, fillColor) {
  const { data, width, height } = imageData;
  const stack = [[x, y]];
  const idx = (y * width + x) * 4;
  const targetColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  if (colorMatch(targetColor, fillColor)) return;
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const i = (cy * width + cx) * 4;
    const current = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (!colorMatch(current, targetColor)) continue;
    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
    data[i + 3] = fillColor[3];
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

// --- Componenta principală ---
export default function Canvas() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [manualColorInput, setManualColorInput] = useState("#000000");
  const [cursorPos, setCursorPos] = useState(null);
  const overlayImage = useImage(showOverlay ? steps[currentStep]?.image : null);

  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  // Limita pașilor pentru Undo
  const MAX_UNDO_STEPS = 30;

  const updateLines = (newLines) => {
    setHistory((prev) => {
      const newHistory = [...prev, lines];
      // Limitează istoricul la MAX_UNDO_STEPS
      if (newHistory.length > MAX_UNDO_STEPS) {
        return newHistory.slice(newHistory.length - MAX_UNDO_STEPS);
      }
      return newHistory;
    });
    setLines(newLines);
    setRedoStack([]);
  };

  const handleMouseDown = async (e) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;

    if (tool === TOOL_BUCKET) {
      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, 500, 500);

      // Desenează toate elementele existente pe canvas-ul ascuns
      const drawPromises = lines.map(line => {
        return new Promise(resolve => {
            if (line.type === 'bucketFill') {
                const img = new Image();
                img.src = line.imageData;
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, 500, 500);
                    resolve();
                };
                img.onerror = () => resolve(); // Continuă chiar dacă imaginea nu se încarcă
            } else if (line.isFillRect) {
              ctx.globalAlpha = line.opacity ?? 1;
              ctx.fillStyle = line.fill;
              ctx.fillRect(0, 0, 500, 500);
              resolve();
            } else {
              ctx.globalAlpha = line.opacity ?? 1;
              ctx.strokeStyle = line.stroke;
              ctx.lineWidth = line.strokeWidth;
              ctx.lineCap = line.lineCap || "round";
              ctx.lineJoin = line.lineJoin || "round";
              ctx.beginPath();
              const pts = line.points;
              if (pts.length > 1) {
                  ctx.moveTo(pts[0], pts[1]);
                  for (let i = 2; i < pts.length; i += 2) {
                      ctx.lineTo(pts[i], pts[i + 1]);
                  }
              }
              ctx.stroke();
              resolve();
            }
        });
      });
      
      // Așteaptă ca toate elementele să fie desenate înainte de flood fill
      await Promise.all(drawPromises);
      ctx.globalAlpha = 1;

      // Aplică algoritmul flood fill
      const imageData = ctx.getImageData(0, 0, 500, 500);
      const rgbaColor = hexToRgba(color);
      floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), rgbaColor);
      ctx.putImageData(imageData, 0, 0);

      // Salvează noua umplere ca un obiect în lista de linii
      const newFillDataUrl = canvas.toDataURL();

      updateLines([
        ...lines,
        {
          type: 'bucketFill',
          imageData: newFillDataUrl,
          opacity: opacity,
          width: 500,
          height: 500,
        },
      ]);
      
      isDrawing.current = false;
      return;
    }

    if (tool !== TOOL_ERASER) {
      updateLines([
        ...lines,
        {
          type: 'stroke',
          points: [pos.x, pos.y],
          stroke: color,
          strokeWidth,
          tension: tool === TOOL_PEN ? 0 : 0.5,
          lineCap: "round",
          lineJoin: "round",
          compositeOperation: "source-over",
          opacity,
          tool,
        },
      ]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setCursorPos(pos);
    if (!isDrawing.current) return;

    if (tool === TOOL_ERASER) {
      updateLines(eraseAtPosition(lines, pos.x, pos.y, strokeWidth / 2));
    } else if (tool === TOOL_PEN) {
      const newLines = [...lines];
      const currentLine = newLines[newLines.length - 1];
      if (!currentLine) return;
      const pts = currentLine.points;
      const lastX = pts[pts.length - 2];
      const lastY = pts[pts.length - 1];
      const dx = pos.x - lastX;
      const dy = pos.y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let newWidth = strokeWidth - dist / 5;
      if (newWidth < 1) newWidth = 1;
      if (newWidth > strokeWidth) newWidth = strokeWidth;
      if (dist < 1) return;
      const segment = {
        type: 'stroke',
        points: [lastX, lastY, pos.x, pos.y],
        stroke: color,
        strokeWidth: newWidth,
        tension: 0,
        lineCap: "round",
        lineJoin: "round",
        compositeOperation: "source-over",
        opacity,
        tool,
      };
      updateLines([...newLines, segment]);
    } else {
      const newLines = [...lines];
      const currentLine = newLines[newLines.length - 1];
      if (!currentLine) return;
      currentLine.points = currentLine.points.concat([pos.x, pos.y]);
      setLines(newLines);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [lines, ...r]);
    setLines(prev);
    setHistory((h) => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    setHistory((h) => [...h, lines]);
    setLines(next);
    setRedoStack(rest);
  };

  const handleManualColorChange = (e) => {
    const val = e.target.value;
    setManualColorInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      setColor(val);
    }
  };

  useEffect(() => {
    setManualColorInput(color);
  }, [color]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lines, history, redoStack]);

  const step = steps[currentStep] || {};

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
        <canvas
            ref={hiddenCanvasRef}
            width={500}
            height={500}
            style={{ display: "none" }}
        />
        <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
            {[TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET].map((t) => (
                <button
                key={t}
                onClick={() => {
                    setTool(t);
                    isDrawing.current = false;
                }}
                className={`px-4 py-2 rounded border ${
                    tool === t ? "bg-blue-600 text-white" : "bg-white"
                }`}
                >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}

            <button onClick={handleUndo} className="px-4 py-2 rounded bg-yellow-500 text-white">
                Undo
            </button>
            <button onClick={handleRedo} className="px-4 py-2 rounded bg-green-600 text-white">
                Redo
            </button>

            <button
                onClick={() => {
                setLines([]);
                setHistory([]);
                setRedoStack([]);
                }}
                className="ml-auto px-4 py-2 rounded bg-red-600 text-white"
            >
                Reset
            </button>
            </div>

            <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 select-none">
                Diametru:
                <input
                type="range"
                min={1}
                max={30}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="ml-2"
                />
                <span>{strokeWidth}px</span>
            </label>

            <label className="flex items-center gap-2 select-none">
                Opacitate:
                <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="ml-2"
                />
                <span>{Math.round(opacity * 100)}%</span>
            </label>
            </div>

            <div className="mb-6 max-w-xs">
            <HexColorPicker color={color} onChange={setColor} />
            <input
                type="text"
                value={manualColorInput}
                onChange={handleManualColorChange}
                className="mt-2 w-full border rounded px-2 py-1 text-center font-mono"
                placeholder="#000000"
                maxLength={7}
            />
            </div>

            <Stage
            ref={stageRef}
            width={500}
            height={500}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="border rounded shadow bg-white cursor-none"
            >
            <Layer>
                {showOverlay && overlayImage && (
                <KonvaImage image={overlayImage} width={500} height={500} opacity={0.3} />
                )}
            </Layer>
            <Layer>
                {lines.map((line, i) => {
                    if (line.type === 'bucketFill') {
                        // Randează umplerea cu găleata ca o imagine Konva
                        const img = new window.Image();
                        img.src = line.imageData;
                        return (
                            <KonvaImage 
                                key={i} 
                                image={img} 
                                x={0} 
                                y={0} 
                                width={line.width} 
                                height={line.height} 
                                opacity={line.opacity} 
                            />
                        );
                    } else if (line.isFillRect) {
                        return (
                            <rect key={i} x={0} y={0} width={500} height={500} fill={line.fill} opacity={line.opacity} />
                        );
                    } else {
                        // Randează liniile obișnuite
                        return (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.stroke}
                                strokeWidth={line.strokeWidth}
                                tension={line.tension}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={line.compositeOperation || "source-over"}
                                opacity={line.opacity || 1}
                            />
                        );
                    }
                })}
                {cursorPos && (
                <Circle
                    x={cursorPos.x}
                    y={cursorPos.y}
                    radius={strokeWidth / 2}
                    stroke={tool === TOOL_ERASER ? "#999" : "#333"}
                    strokeWidth={1}
                    fillEnabled={false}
                    dash={[]}
                    listening={false}
                />
                )}
            </Layer>
            </Stage>

            <div className="mt-6 flex items-center gap-4">
            <button
                onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
            >
                Înapoi
            </button>
            <button
                onClick={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
                disabled={currentStep === steps.length - 1}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            >
                Următorul
            </button>

            <label className="ml-auto flex items-center gap-2 select-none">
                <input
                type="checkbox"
                checked={showOverlay}
                onChange={() => setShowOverlay((v) => !v)}
                className="w-5 h-5"
                />
                Canvas transparent ghidat
            </label>
            </div>
        </div>

        <div className="bg-white p-6 rounded shadow flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
            <p className="mb-4 max-w-md text-center">{step.description}</p>
            {step.image && (
            <img
                src={step.image}
                alt={`Step ${currentStep + 1}`}
                className="max-w-full max-h-64 rounded border"
                loading="lazy"
            />
            )}
        </div>
    </main>
  );
}
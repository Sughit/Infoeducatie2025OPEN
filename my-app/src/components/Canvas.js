import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";

// unelte
const TOOL_PENCIL = "pencil";
const TOOL_BRUSH = "brush";
const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const TOOL_BUCKET = "bucket";
const TOOL_EYEDROPPER = "eyedropper"; // Adăugat eyedropper

function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, Math.round(alpha * 255)];
}

function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(imageData, x, y, fillColor) {
  const { data, width, height } = imageData;
  const stack = [[x, y]];
  const startIndex = (y * width + x) * 4;
  const targetColor = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];
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

export default function Canvas({ canvasSize = 460, onChange }) {
  const { t } = useTranslation();

  const [currentCanvasDataUrl, setCurrentCanvasDataUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [manualColorInput, setManualColorInput] = useState("#000000");
  const [cursorPos, setCursorPos] = useState(null);
  const [exportUri, setExportUri] = useState(null);

  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const lastPos = useRef(null);
  const konvaDrawingImageRef = useRef(new window.Image());
  const MAX_UNDO_STEPS = 30;

  const exportImage = () => {
    const uri = stageRef.current.toDataURL();
    console.log(uri);
    if (onChange) onChange(uri);
    setExportUri(uri);
  };

  const updateCanvasImage = useCallback((newImageDataUrl) => {
    setHistory((prev) => {
      const newHistory = [...prev, currentCanvasDataUrl];
      if (newHistory.length > MAX_UNDO_STEPS) {
        return newHistory.slice(newHistory.length - MAX_UNDO_STEPS);
      }
      return newHistory;
    });
    setCurrentCanvasDataUrl(newImageDataUrl);
    konvaDrawingImageRef.current.src = newImageDataUrl;
    setRedoStack([]);
  }, [currentCanvasDataUrl]);

  const handleMouseDown = async (e) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;
    lastPos.current = pos;

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    if (konvaDrawingImageRef.current && konvaDrawingImageRef.current.complete) {
      ctx.drawImage(konvaDrawingImageRef.current, 0, 0, canvasSize, canvasSize);
    } else if (konvaDrawingImageRef.current.src) {
      await new Promise(resolve => {
        konvaDrawingImageRef.current.onload = () => {
          ctx.drawImage(konvaDrawingImageRef.current, 0, 0, canvasSize, canvasSize);
          resolve();
        };
      });
    }

    if (tool === TOOL_BUCKET) {
      const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const rgbaColor = hexToRgba(color, opacity);
      floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), rgbaColor);
      ctx.putImageData(imageData, 0, 0);

      const newFillDataUrl = canvas.toDataURL();
      updateCanvasImage(newFillDataUrl);
      isDrawing.current = false;
      return;
    }

    if (tool === TOOL_EYEDROPPER) { // Logica pentru Eyedropper
      const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const px = Math.floor(pos.x);
      const py = Math.floor(pos.y);
      let pickedColor = "#ffffff"; // default alb
      if (px >= 0 && py >= 0 && px < canvasSize && py < canvasSize) {
        const i = (py * canvasSize + px) * 4;
        const data = imageData.data;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        pickedColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
      setColor(pickedColor);
      setTool(TOOL_PENCIL); // Setează înapoi la pencil după ce alege culoarea
      isDrawing.current = false;
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;

    if (tool === TOOL_ERASER) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (tool !== TOOL_PEN) {
      ctx.lineTo(pos.x + 0.001, pos.y + 0.001);
      ctx.stroke();
    }
    konvaDrawingImageRef.current.src = canvas.toDataURL();
  };

  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setCursorPos(pos);

    if (!isDrawing.current || !lastPos.current) return;

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === TOOL_ERASER) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool !== TOOL_EYEDROPPER && tool !== TOOL_BUCKET) { // Asigură-te că nu desenează când e eyedropper sau bucket
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = opacity;

      if (tool === TOOL_BRUSH) {
        const dist = Math.sqrt(Math.pow(pos.x - lastPos.current.x, 2) + Math.pow(pos.y - lastPos.current.y, 2));
        const angle = Math.atan2(pos.y - lastPos.current.y, pos.x - lastPos.current.x);
        for (let i = 0; i < dist; i += 2) {
          const x = lastPos.current.x + Math.cos(angle) * i;
          const y = lastPos.current.y + Math.sin(angle) * i;
          ctx.beginPath();
          ctx.arc(x, y, strokeWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity * 0.2;
          ctx.fill();
        }
        ctx.globalAlpha = opacity;
      } else if (tool === TOOL_PEN) {
        const lastX = lastPos.current.x;
        const lastY = lastPos.current.y;
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let newWidth = strokeWidth - dist / 5;
        if (newWidth < 1) newWidth = 1;
        if (newWidth > strokeWidth) newWidth = strokeWidth;
        if (dist > 1) {
          ctx.lineWidth = newWidth;
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
        ctx.globalAlpha = opacity;
      } else {
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.globalAlpha = opacity;
      }
    }
    lastPos.current = pos;
    konvaDrawingImageRef.current.src = canvas.toDataURL();
  }, [tool, strokeWidth, color, opacity]);

    const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (lastPos.current && tool === TOOL_PEN) {
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(lastPos.current.x + 0.001, lastPos.current.y + 0.001);
      ctx.stroke();
    }

    lastPos.current = null;

    // DOAR dacă NU e galeata sau eyedropper, actualizăm imaginea
    if (tool !== TOOL_BUCKET && tool !== TOOL_EYEDROPPER) { // Aici am adăugat condiția pentru TOOL_EYEDROPPER
      updateCanvasImage(canvas.toDataURL());
    }
  }, [updateCanvasImage, tool, strokeWidth]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevImageData = history[history.length - 1];
    setRedoStack((r) => [currentCanvasDataUrl, ...r]);
    setCurrentCanvasDataUrl(prevImageData);
    konvaDrawingImageRef.current.src = prevImageData;
    setHistory((h) => h.slice(0, -1));
  }, [history, currentCanvasDataUrl]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [nextImageData, ...rest] = redoStack;
    setHistory((h) => [...h, currentCanvasDataUrl]);
    setCurrentCanvasDataUrl(nextImageData);
    konvaDrawingImageRef.current.src = nextImageData;
    setRedoStack(rest);
  }, [redoStack, currentCanvasDataUrl]);

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
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleUndo, handleRedo]);

  const cursorStyle = () => {
    if (!cursorPos) return 'default';

    if (tool === TOOL_EYEDROPPER || tool === TOOL_BUCKET) {
      return 'crosshair';
    }

    if (tool === TOOL_ERASER) return 'crosshair';
    return 'default';
  };

  return (
    <main className="flex flex-col md:flex-row h-full pt-16">
      {/* Sidebar cu controale */}
      <aside className="w-full md:w-1/3 p-4 overflow-auto bg-gray-50 flex-shrink-0 pt-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {[TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET, TOOL_EYEDROPPER].map((tName) => ( // Adăugat TOOL_EYEDROPPER aici
            <button
              key={tName}
              onClick={() => {
                setTool(tName);
                isDrawing.current = false;
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: tool === tName ? "2px solid #297373" : "2px solid #297373",
                backgroundColor: tool === tName ? "#FF8552" : "#FFFFFF",
                color: tool === tName ? "#FFFFFF" : "#297373",
                fontWeight: tool === tName ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              className={`px-3 py-2 rounded border ${tool === tName ? "bg-blue-600 text-white" : "bg-white"}`}
            >
              {t(tName)}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-black">
            {t("diameter")} ({strokeWidth}px)
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={strokeWidth}
            onChange={e => setStrokeWidth(Number(e.target.value))}
            className="w-full custom-range"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-black">
            {t("opacity")} ({Math.round(opacity * 100)}%)
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-full custom-range"
          />
        </div>

        <style>{`
          .custom-range::-webkit-slider-runnable-track {
            background: #297373;
            height: 6px;
            border-radius: 4px;
          }
          .custom-range::-moz-range-track {
            background: #297373;
            height: 6px;
            border-radius: 4px;
          }
          .custom-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #FF8552;
            cursor: pointer;
            margin-top: -6px;
            border: none;
          }
          .custom-range::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #FF8552;
            cursor: pointer;
            border: none;
          }
        `}</style>

        <div className="mb-4">
          <HexColorPicker color={color} onChange={setColor} />
          <input type="text" value={manualColorInput} onChange={handleManualColorChange} className="mt-2 w-full border rounded px-2 py-1 text-center font-mono" placeholder="#000000" maxLength={7} />
        </div>
      </aside>

      <section className="w-full md:w-2/3 p-4 flex flex-col items-center bg-white">
        <div style={{ marginTop: "48px" }}></div>
        <canvas
          ref={hiddenCanvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{ display: "none", width: `${canvasSize}px`, height: `${canvasSize}px`}}
        />
        {/*Zona Desen*/}
        <Stage
          ref={stageRef}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border rounded shadow bg-white"
          style={{ width: `${canvasSize}px`, height: `${canvasSize}px`, cursor: cursorStyle() }}
        >
          <Layer>
            <KonvaImage
              image={konvaDrawingImageRef.current}
              x={0}
              y={0}
              width={canvasSize}
              height={canvasSize}
              opacity={1}
            />
            {cursorPos && (tool !== TOOL_BUCKET && tool !== TOOL_EYEDROPPER) && ( // Cercul pentru cursor, exclus eyedropper și bucket
              <Circle
                x={cursorPos.x}
                y={cursorPos.y}
                radius={tool === TOOL_BUCKET ? 0 : strokeWidth / 2}
                stroke={tool === TOOL_ERASER ? "#999" : "#333"}
                strokeWidth={1}
                fillEnabled={false}
                dash={[]}
                listening={false}
              />
            )}
            {cursorPos && (tool === TOOL_EYEDROPPER || tool === TOOL_BUCKET) && ( // Cerc specific pentru eyedropper/bucket
              <Circle
                x={cursorPos.x}
                y={cursorPos.y}
                radius={10}
                stroke="black"
                strokeWidth={1}
                fillEnabled={false}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
        <div className="flex gap-2 mt-4 mb-4 w-full max-w-md">
          <button onClick={handleUndo} className="flex-1 py-2 rounded bg-yellow text-white"
            disabled={history.length === 0}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #297373",
              backgroundColor: history.length === 0 ? "#ccc" : "#FF8552",
              color: "#fff",
              cursor: history.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "700",
              transition: "background-color 0.3s",
            }}>
            {t("undo")}</button> {/* Tradus "Undo" */}
          <button onClick={handleRedo} className="flex-1 py-2 rounded bg-green text-white"
            disabled={redoStack.length === 0}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #297373",
              backgroundColor: redoStack.length === 0 ? "#ccc" : "#FF8552",
              color: "#fff",
              cursor: redoStack.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "700",
              transition: "background-color 0.3s",
            }}
          >{t("redo")}</button> {/* Tradus "Redo" */}
          <button
            onClick={() => {
              setCurrentCanvasDataUrl("");
              setHistory([]);
              setRedoStack([]);
              konvaDrawingImageRef.current = new window.Image();
            }}
            className="flex-1 py-2 rounded bg-red-600 text-white"
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #297373",
              backgroundColor: "#c92020ff",
              color: "#fff",
              fontWeight: "700",
              transition: "background-color 0.3s",
            }}
          >
            {t("reset")} {/* Tradus "Reset" */}
          </button>
        </div>
      </section>
    </main>
  );
}
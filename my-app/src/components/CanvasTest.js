import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";
import {
  TOOL_PENCIL,
  TOOL_BRUSH,
  TOOL_PEN,
  TOOL_ERASER,
  TOOL_BUCKET,
  hexToRgba,
  floodFill,
  handleUndo,
  handleRedo,
  handleReset,
} from "./CanvasLogic";

// Hook pentru încărcarea imaginilor
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
    return () => {
      img.onload = null;
    };
  }, [url]);
  return image;
}

export default function Canvas() {
    const [currentCanvasDataUrl, setCurrentCanvasDataUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [manualColorInput, setManualColorInput] = useState("#000000");
  const [cursorPos, setCursorPos] = useState(null);

  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const lastPos = useRef(null);
  const konvaDrawingImageRef = useRef(new window.Image());

  // Actualizează istoric și imagine
  const updateCanvasImage = useCallback((newUrl) => {
    setHistory(prev => {
      const newHist = [...prev, currentCanvasDataUrl];
      return newHist.length > 30 ? newHist.slice(newHist.length - 30) : newHist;
    });
    setCurrentCanvasDataUrl(newUrl);
    konvaDrawingImageRef.current.src = newUrl;
    setRedoStack([]);
  }, [currentCanvasDataUrl]);

  const handleMouseDown = async (e) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;
    lastPos.current = pos;

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, 500, 500);
    if (konvaDrawingImageRef.current.complete) {
      ctx.drawImage(konvaDrawingImageRef.current, 0, 0, 500, 500);
    } else if (konvaDrawingImageRef.current.src) {
      await new Promise(resolve => {
        konvaDrawingImageRef.current.onload = () => {
          ctx.drawImage(konvaDrawingImageRef.current, 0, 0, 500, 500);
          resolve();
        };
      });
    }

    if (tool === TOOL_BUCKET) {
      const imageData = ctx.getImageData(0, 0, 500, 500);
      const rgba = hexToRgba(color, opacity);
      floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), rgba);
      ctx.putImageData(imageData, 0, 0);
      updateCanvasImage(canvas.toDataURL());
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
    const pos = e.target.getStage().getPointerPosition();
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
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = opacity;

      if (tool === TOOL_BRUSH) {
        const dist = Math.hypot(pos.x - lastPos.current.x, pos.y - lastPos.current.y);
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
        const dx = pos.x - lastPos.current.x;
        const dy = pos.y - lastPos.current.y;
        const dist = Math.hypot(dx, dy);
        let newWidth = strokeWidth - dist / 5;
        newWidth = Math.max(1, Math.min(newWidth, strokeWidth));
        if (dist > 1) {
          ctx.lineWidth = newWidth;
          ctx.beginPath();
          ctx.moveTo(lastPos.current.x, lastPos.current.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
        ctx.globalAlpha = opacity;
      } else {
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
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(lastPos.current.x + 0.001, lastPos.current.y + 0.001);
      ctx.stroke();
    }
    lastPos.current = null;
    updateCanvasImage(canvas.toDataURL());
  }, [updateCanvasImage, tool, strokeWidth]);

  // Handler pentru schimbarea manuală a culorii (input text)
  const handleManualColorChange = (e) => {
    const val = e.target.value;
    setManualColorInput(val);
    // Validează formatul hex înainte de a seta culoarea
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      setColor(val);
    }
  };

  // Sincronizează inputul manual de culoare cu selecția din color picker
  useEffect(() => {
    setManualColorInput(color);
  }, [color]);

  // Tastaturi pentru undo/redo
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo(history, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef);
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo(redoStack, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, redoStack, currentCanvasDataUrl]);

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
      <canvas ref={hiddenCanvasRef} width={500} height={500} style={{ display: "none" }} />
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {[TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET].map(t => (
            <button key={t} onClick={() => { setTool(t); isDrawing.current = false; }} className={`px-4 py-2 rounded border ${tool === t ? "bg-blue-600 text-white" : "bg-white"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button onClick={() => handleUndo(history, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef)} className="px-4 py-2 rounded bg-yellow-500 text-white" disabled={history.length===0}>Undo</button>
          <button onClick={() => handleRedo(redoStack, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef)} className="px-4 py-2 rounded bg-green-600 text-white" disabled={redoStack.length===0}>Redo</button>
          <button onClick={() => handleReset(setCurrentCanvasDataUrl, setHistory, setRedoStack, konvaDrawingImageRef)} className="ml-auto px-4 py-2 rounded bg-red-600 text-white">Reset</button>
        </div>

        {/* Controale pentru Diametru și Opacitate */}
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

        {/* Selector de Culoare și Input Manual */}
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

        {/* Zona de Desen Konva */}
        <Stage
          ref={stageRef}
          width={500}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`border rounded shadow bg-white cursor-none ${tool === TOOL_BUCKET ? 'cursor-crosshair' : ''}`}
        >
          {/* Stratul pentru desenul utilizatorului */}
          <Layer>
            <KonvaImage
              image={konvaDrawingImageRef.current}
              x={0}
              y={0}
              width={500}
              height={500}
              opacity={1}
            />
            {/* Cercul care reprezintă cursorul uneltei */}
            {cursorPos && (
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
          </Layer>
        </Stage>
      </div>
    </main>
  );
}

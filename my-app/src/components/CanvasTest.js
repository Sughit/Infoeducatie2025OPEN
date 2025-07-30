import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Stage, Layer, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";
import {
  TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET,
  hexToRgba, floodFill, handleUndo, handleRedo, handleReset,
} from "./CanvasLogic";

const TOOL_LIST = [TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET];

function Sidebar({
  tool, setTool, strokeWidth, setStrokeWidth, opacity, setOpacity,
  color, setColor, manualColorInput, setManualColorInput,
  handleManualColorChange, handleUndoClick, handleRedoClick, handleResetClick,
  history, redoStack
}) {
  return (
    <aside className="w-full md:w-1/2 p-4 overflow-auto bg-gray-light">
      <div className="flex flex-wrap gap-2 mb-4">
        {TOOL_LIST.map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`px-3 py-2 rounded border ${tool === t ? "bg-green text-white" : "bg-gray text-black"}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={handleUndoClick} className="flex-1 py-2 rounded bg-yellow text-black disabled:opacity-50" disabled={!history.length}>Undo</button>
        <button onClick={handleRedoClick} className="flex-1 py-2 rounded bg-green text-white disabled:opacity-50" disabled={!redoStack.length}>Redo</button>
        <button onClick={handleResetClick} className="flex-1 py-2 rounded bg-orange text-white">Reset</button>
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-black">Diametru ({strokeWidth}px)</label>
        <input type="range" min={1} max={30} value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)} className="w-full" />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-black">Opacitate ({Math.round(opacity*100)}%)</label>
        <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full" />
      </div>
      <div className="mb-4">
        <HexColorPicker color={color} onChange={setColor} />
        <input type="text" value={manualColorInput} onChange={handleManualColorChange} className="mt-2 w-full border rounded px-2 py-1 text-center font-mono" placeholder="#000000" maxLength={7} />
      </div>
    </aside>
  );
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
  const hiddenCanvasRef = useRef(null);
  const lastPos = useRef(null);
  const konvaDrawingImageRef = useRef(new window.Image());
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(300);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) setCanvasSize(containerRef.current.offsetWidth);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleManualColorChange = useCallback((e) => {
    const val = e.target.value;
    setManualColorInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) setColor(val);
  }, []);

  useEffect(() => setManualColorInput(color), [color]);

  // Undo/Redo key shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo(history, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleRedo(redoStack, currentCanvasDataUrl, setHistory, setRedoStack, setCurrentCanvasDataUrl, konvaDrawingImageRef);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [history, redoStack, currentCanvasDataUrl]);

  // Drawing logic
  const getContext = useCallback(() => {
    const canvas = hiddenCanvasRef.current;
    return canvas ? canvas.getContext("2d", { willReadFrequently: true }) : null;
  }, [canvasSize]);

  const handleMouseDown = useCallback((e) => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return;
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;
    lastPos.current = pos;
    const ctx = getContext();
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    if (konvaDrawingImageRef.current.complete && konvaDrawingImageRef.current.src) {
      ctx.drawImage(konvaDrawingImageRef.current, 0, 0, canvasSize, canvasSize);
    }
    if (tool === TOOL_BUCKET) {
      const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
      const rgba = hexToRgba(color, opacity);
      floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), rgba);
      ctx.putImageData(imageData, 0, 0);
      setHistory(prev => [...prev, currentCanvasDataUrl].slice(-30));
      const newUrl = canvas.toDataURL();
      setCurrentCanvasDataUrl(newUrl);
      konvaDrawingImageRef.current.src = newUrl;
      setRedoStack([]);
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
  }, [tool, strokeWidth, color, opacity, canvasSize, currentCanvasDataUrl, getContext]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing.current || !lastPos.current) return;
    const pos = e.target.getStage().getPointerPosition();
    setCursorPos(pos);
    const ctx = getContext();
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
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
    konvaDrawingImageRef.current.src = hiddenCanvasRef.current.toDataURL();
  }, [tool, strokeWidth, color, opacity, canvasSize, getContext]);

  const handleMouseUp = useCallback(() => {
    if (!hiddenCanvasRef.current) return;
    isDrawing.current = false;
    const ctx = getContext();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    setHistory(prev => [...prev, currentCanvasDataUrl].slice(-30));
    const newUrl = hiddenCanvasRef.current.toDataURL();
    setCurrentCanvasDataUrl(newUrl);
    konvaDrawingImageRef.current.src = newUrl;
    setRedoStack([]);
    lastPos.current = null;
  }, [currentCanvasDataUrl, getContext]);

  const drawImageOnHiddenCanvas = useCallback((imgSrc) => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = new window.Image();
    img.src = imgSrc || "";
    img.onload = () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
    };
  }, [canvasSize]);

  const handleUndoClick = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setRedoStack(prevRedo => [currentCanvasDataUrl, ...prevRedo]);
    setCurrentCanvasDataUrl(prev);
    konvaDrawingImageRef.current.src = prev;
    setHistory(prevHist => prevHist.slice(0, -1));
    // Desenează instant pe canvas ascuns
    const canvas = hiddenCanvasRef.current;
    if (canvas && prev) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const img = new window.Image();
        img.src = prev;
        img.onload = () => {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        };
    }
    }, [history, currentCanvasDataUrl, canvasSize]);

    const handleRedoClick = useCallback(() => {
    if (!redoStack.length) return;
    const [next, ...rest] = redoStack;
    setHistory(prev => [...prev, currentCanvasDataUrl]);
    setCurrentCanvasDataUrl(next);
    konvaDrawingImageRef.current.src = next;
    setRedoStack(rest);
    // Desenează instant pe canvas ascuns
    const canvas = hiddenCanvasRef.current;
    if (canvas && next) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const img = new window.Image();
        img.src = next;
        img.onload = () => {
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        };
    }
    }, [redoStack, currentCanvasDataUrl, canvasSize]);

  const handleResetClick = useCallback(() =>
    handleReset(setCurrentCanvasDataUrl, setHistory, setRedoStack, konvaDrawingImageRef),
    []
  );

  return (
    <main className="flex flex-col md:flex-row h-full">
      <Sidebar
        tool={tool} setTool={setTool}
        strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
        opacity={opacity} setOpacity={setOpacity}
        color={color} setColor={setColor}
        manualColorInput={manualColorInput} setManualColorInput={setManualColorInput}
        handleManualColorChange={handleManualColorChange}
        handleUndoClick={handleUndoClick}
        handleRedoClick={handleRedoClick}
        handleResetClick={handleResetClick}
        history={history} redoStack={redoStack}
      />
      <section ref={containerRef} className="w-full md:w-1/2 p-4 flex justify-center items-center bg-gray-base">
        <canvas ref={hiddenCanvasRef} width={canvasSize} height={canvasSize} style={{ display: 'none' }} />
        <Stage
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-auto border rounded shadow bg-white"
        >
          <Layer>
            <KonvaImage image={konvaDrawingImageRef.current} width={canvasSize} height={canvasSize} />
            {cursorPos && (
              <Circle
                x={cursorPos.x}
                y={cursorPos.y}
                radius={tool === TOOL_BUCKET ? 0 : strokeWidth / 2}
                stroke={tool === TOOL_ERASER ? "#E6E6E6" : "#297373"}
                strokeWidth={1}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </section>
    </main>
  );
}

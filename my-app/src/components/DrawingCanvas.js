// DrawingCanvas.jsx
import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";

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
  const newLines = [];
  linesArray.forEach((line) => {
    const pts = line.points;
    let currentSegment = [];
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i];
      const y1 = pts[i + 1];
      const x2 = pts[i + 2];
      const y2 = pts[i + 3];
      if (segmentIntersectsCircle(x1, y1, x2, y2, cx, cy, r)) {
        if (currentSegment.length >= 6) {
          newLines.push({ ...line, points: currentSegment });
        }
        currentSegment = [];
      } else {
        if (currentSegment.length === 0) currentSegment.push(x1, y1);
        currentSegment.push(x2, y2);
      }
    }
    if (currentSegment.length >= 6) {
      let dist = 0;
      for (let i = 0; i < currentSegment.length - 2; i += 2) {
        const dx = currentSegment[i + 2] - currentSegment[i];
        const dy = currentSegment[i + 3] - currentSegment[i + 1];
        dist += Math.sqrt(dx * dx + dy * dy);
      }
      if (dist > 2) {
        newLines.push({ ...line, points: currentSegment });
      }
    }
  });
  return newLines;
}

export default function DrawingCanvas({ overlayImageUrl }) {
  const [lines, setLines] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [manualColorInput, setManualColorInput] = useState("#000000");
  const [cursorPos, setCursorPos] = useState(null);

  const overlayImage = useImage(overlayImageUrl);

  const isDrawing = useRef(false);

  const updateLines = (newLines) => {
    setHistory((prev) => [...prev, lines]);
    setLines(newLines);
    setRedoStack([]);
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;

    if (tool === TOOL_BUCKET) {
      updateLines([
        {
          points: [0, 0, 500, 0, 500, 500, 0, 500],
          stroke: color,
          strokeWidth: 0,
          fill: color,
          isFillRect: true,
          opacity,
          compositeOperation: "source-over",
        },
      ]);
      isDrawing.current = false;
      return;
    }

    if (tool !== TOOL_ERASER) {
      updateLines([
        ...lines,
        {
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {[TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
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
        width={500}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border rounded shadow bg-white cursor-none"
      >
        <Layer>
          {overlayImage && (
            <KonvaImage image={overlayImage} width={500} height={500} opacity={0.3} />
          )}
        </Layer>

        <Layer>
          {lines.map((line, i) =>
            line.isFillRect ? (
              <rect
                key={i}
                x={0}
                y={0}
                width={500}
                height={500}
                fill={line.fill}
                opacity={line.opacity}
              />
            ) : (
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
            )
          )}
          {cursorPos && (
            <Circle
              x={cursorPos.x}
              y={cursorPos.y}
              radius={strokeWidth / 2}
              stroke={tool === TOOL_ERASER ? "#999" : "#333"}
              strokeWidth={3}
              fillEnabled={false}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

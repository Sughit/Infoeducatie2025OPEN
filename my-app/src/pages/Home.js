import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Image as KonvaImage, Rect } from "react-konva";
import { HexColorPicker } from "react-colorful";

const BACKGROUND_COLOR = "#ffffff";

const steps = [
  {
    title: "Pasul 1: Forma feței",
    description: "Începe prin a trasa un oval pentru forma generală a capului.",
    image: "/imagini/step1.gif",
  },
  {
    title: "Pasul 2: Axe de simetrie",
    description: "Trasează o linie verticală și una orizontală pentru a împărți fața corect.",
    image: "/imagini/step2.jpg",
  },
  {
    title: "Pasul 3: Ochii",
    description: "Adaugă ochii la linia orizontală, la distanță egală.",
    image: "/imagini/step3.png",
  },
  {
    title: "Pasul 4: Nasul și gura",
    description: "Desenează nasul sub ochi și gura între nas și bărbie.",
    image: "/imagini/step4.png",
  },
  {
    title: "Pasul 5: Contur final și detalii",
    description: "Adaugă detalii precum sprâncene, urechi și păr.",
    image: "/imagini/step5.png",
  },
];

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

const TOOL_PENCIL = "pencil";
const TOOL_BRUSH = "brush";
const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const TOOL_BUCKET = "bucket";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [lastPos, setLastPos] = useState(null);

  const overlayImage = useImage(showOverlay ? steps[currentStep]?.image : null);

  // Stilou: calculează grosimea segmentului curent
  const calculateStrokeWidthPen = (pt1, pt2) => {
    if (!pt1 || !pt2) return strokeWidth;
    const dx = pt2.x - pt1.x;
    const dy = pt2.y - pt1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let w = strokeWidth - dist / 5;
    if (w < 1) w = 1;
    if (w > strokeWidth) w = strokeWidth;
    return w;
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();

    if (tool === TOOL_BUCKET) {
      // Bucket umple doar fundalul cu culoarea curentă
      setLines([
        {
          points: [0, 0, 500, 0, 500, 500, 0, 500, 0, 0],
          fill: color,
          isFillRect: true,
          opacity,
          compositeOperation: "source-over",
        },
      ]);
      return;
    }

    isDrawing.current = true;

    let lineWidth = strokeWidth;
    let compOp = "source-over";
    let strokeCol = color;
    let opac = opacity;

    if (tool === TOOL_ERASER) {
      // Eraser nu șterge fundalul transparent, deci desenează cu culoarea BACKGROUND_COLOR
      strokeCol = BACKGROUND_COLOR;
      compOp = "source-over";
      opac = 1;
    }

    if (tool === TOOL_BRUSH) {
      opac = 0.5;
    }

    setLines((prev) => [
      ...prev,
      {
        points: [pos.x, pos.y],
        stroke: strokeCol,
        strokeWidth: lineWidth,
        tension: tool === TOOL_PEN ? 0 : 0.5,
        lineCap: "round",
        lineJoin: "round",
        compositeOperation: compOp,
        opacity: opac,
      },
    ]);
    setLastPos(pos);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setLines((prevLines) => {
      const lastLine = prevLines[prevLines.length - 1];
      if (!lastLine) return prevLines;

      let newStrokeWidth = lastLine.strokeWidth;

      if (tool === TOOL_PEN) {
        // Stiloul modifică doar grosimea segmentului curent
        newStrokeWidth = calculateStrokeWidthPen(lastPos, pos);
      }

      lastLine.points = lastLine.points.concat([pos.x, pos.y]);
      lastLine.strokeWidth = newStrokeWidth;

      return [...prevLines.slice(0, prevLines.length - 1), lastLine];
    });

    setLastPos(pos);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setLastPos(null);
  };

  const handleReset = () => {
    setLines([]);
  };

  const step = steps[currentStep] || {};

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
      <div>
        {/* Unelte */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {[
            { id: TOOL_PENCIL, label: "Creion" },
            { id: TOOL_BRUSH, label: "Pensulă" },
            { id: TOOL_PEN, label: "Stilou" },
            { id: TOOL_ERASER, label: "Radieră" },
            { id: TOOL_BUCKET, label: "Bucket" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`px-4 py-2 rounded border ${
                tool === id ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {label}
            </button>
          ))}

          <button
            onClick={handleReset}
            className="ml-auto px-4 py-2 rounded bg-red-600 text-white"
          >
            Reset
          </button>
        </div>

        {/* Slider grosime */}
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

          {/* Slider opacitate */}
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

        {/* Color Picker cu input text */}
        <div className="mb-6 max-w-xs">
          <HexColorPicker color={color} onChange={setColor} />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-2 w-full rounded border px-2 py-1 text-center font-medium text-gray-700"
            placeholder="#000000"
          />
        </div>

        {/* Canvas */}
        <Stage
          ref={stageRef}
          width={500}
          height={500}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          className="border rounded shadow bg-white"
        >
          <Layer>
            {/* Fundal */}
            {!lines.find((line) => line.isFillRect) && (
              <Rect width={500} height={500} fill={BACKGROUND_COLOR} />
            )}

            {/* Overlay transparent */}
            {showOverlay && overlayImage && (
              <KonvaImage
                image={overlayImage}
                width={500}
                height={500}
                opacity={0.3}
              />
            )}

            {/* Desene */}
            {lines.map((line, i) =>
              line.isFillRect ? (
                <Rect
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
                  lineCap={line.lineCap}
                  lineJoin={line.lineJoin}
                  globalCompositeOperation={line.compositeOperation || "source-over"}
                  opacity={line.opacity || 1}
                />
              )
            )}
          </Layer>
        </Stage>

        {/* Navigare pași și toggle overlay */}
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
            className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
          >
            Următor
          </button>

          <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOverlay}
              onChange={(e) => setShowOverlay(e.target.checked)}
            />
            Arată overlay-ul
          </label>
        </div>

        {/* Text pas curent */}
        <div className="mt-4 p-4 border rounded bg-white shadow-sm">
          <h2 className="text-xl font-bold">{step.title}</h2>
          <p className="mt-2">{step.description}</p>
        </div>
      </div>
    </main>
  );
}

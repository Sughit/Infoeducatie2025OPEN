import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Circle, Image as KonvaImage } from "react-konva";
import { HexColorPicker } from "react-colorful";

// Definim pașii pentru ghid
const steps = [
  {
    title: "Pasul 1: Forma feței",
    description: "Începe prin a trasa un oval pentru forma generală a capului.",
    image: "/imagini/step1.gif",
  },
  // Poți adăuga mai mulți pași aici
];

// Constante pentru unelte
const TOOL_PENCIL = "pencil";
const TOOL_BRUSH = "brush";
const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const TOOL_BUCKET = "bucket";

// Hook personalizat pentru încărcarea imaginilor
function useImage(url) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.src = url;
    img.crossOrigin = "anonymous"; // Permite încărcarea imaginilor de pe alte domenii
    img.onload = () => setImage(img);
    // Curățare la demontarea componentei
    return () => {
      img.onload = null; // Evită memory leaks
    };
  }, [url]);
  return image;
}

// Funcție utilitară pentru a converti codul hex în RGBA
// Acum acceptă un parametru `alpha` (opacitate)
function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; // Extinde hex scurt
  const num = parseInt(c, 16);
  // Returnează un array [R, G, B, A] unde A este alpha * 255
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, Math.round(alpha * 255)]; 
}

// Funcție pentru a compara două culori RGBA
function colorMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

// Algoritmul Flood Fill (umplere cu găleata)
function floodFill(imageData, x, y, fillColor) {
  const { data, width, height } = imageData;
  const stack = [[x, y]];
  const startIndex = (y * width + x) * 4;
  const targetColor = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];

  // Nu face nimic dacă culoarea țintă este deja culoarea de umplere
  if (colorMatch(targetColor, fillColor)) return;

  while (stack.length) {
    const [cx, cy] = stack.pop();

    // Verifică limitele canvasului
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;

    const i = (cy * width + cx) * 4;
    const current = [data[i], data[i + 1], data[i + 2], data[i + 3]];

    // Continuă doar dacă pixelul curent se potrivește cu culoarea țintă
    if (!colorMatch(current, targetColor)) continue;

    // Umple pixelul curent cu noua culoare
    data[i] = fillColor[0];
    data[i + 1] = fillColor[1];
    data[i + 2] = fillColor[2];
    data[i + 3] = fillColor[3]; // Aici se aplică canalul alfa al fillColor

    // Adaugă vecinii în stivă pentru procesare
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

export default function Canvas() {
  // Stări pentru gestionarea aplicației
  const [currentStep, setCurrentStep] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentCanvasDataUrl, setCurrentCanvasDataUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [strokeWidth, setStrokeWidth] = useState(10); // Default la 10px
  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#000000");
  const [manualColorInput, setManualColorInput] = useState("#000000");
  const [cursorPos, setCursorPos] = useState(null);

  // Imaginea de overlay pentru ghid, încărcată cu hook-ul personalizat
  const overlayImage = useImage(showOverlay ? steps[currentStep]?.image : null);

  // Ref-uri pentru elemente Canvas și Konva
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const hiddenCanvasRef = useRef(null); // Canvas ascuns pentru desenare efectivă
  const lastPos = useRef(null); // Ultima poziție a cursorului

  // Referință la obiectul Image pentru Konva, actualizat cu desenul curent
  const konvaDrawingImageRef = useRef(new window.Image());

  // Numărul maxim de pași de undo
  const MAX_UNDO_STEPS = 30;

  // Funcție useCallback pentru a actualiza imaginea canvasului și istoricul
  const updateCanvasImage = useCallback((newImageDataUrl) => {
    setHistory((prev) => {
      const newHistory = [...prev, currentCanvasDataUrl];
      // Limitează istoricul pentru a nu consuma prea multă memorie
      if (newHistory.length > MAX_UNDO_STEPS) {
        return newHistory.slice(newHistory.length - MAX_UNDO_STEPS);
      }
      return newHistory;
    });
    setCurrentCanvasDataUrl(newImageDataUrl);
    konvaDrawingImageRef.current.src = newImageDataUrl;
    setRedoStack([]); // Golește stack-ul de redo la o nouă acțiune
  }, [currentCanvasDataUrl]);

  // Handler pentru evenimentul de apăsare a mouse-ului
  const handleMouseDown = async (e) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;
    lastPos.current = pos;

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Curăță canvasul ascuns și desenează imaginea curentă
    ctx.clearRect(0, 0, 500, 500);
    if (konvaDrawingImageRef.current && konvaDrawingImageRef.current.complete) {
      ctx.drawImage(konvaDrawingImageRef.current, 0, 0, 500, 500);
    } else if (konvaDrawingImageRef.current.src) {
      // Așteaptă încărcarea imaginii dacă nu e gata (important pentru flood fill)
      await new Promise(resolve => {
        konvaDrawingImageRef.current.onload = () => {
          ctx.drawImage(konvaDrawingImageRef.current, 0, 0, 500, 500);
          resolve();
        };
      });
    }

    // Logică pentru umplerea cu găleata
    if (tool === TOOL_BUCKET) {
      const imageData = ctx.getImageData(0, 0, 500, 500);
      // Trimitem culoarea hex și opacitatea curentă funcției hexToRgba
      const rgbaColor = hexToRgba(color, opacity); 
      floodFill(imageData, Math.floor(pos.x), Math.floor(pos.y), rgbaColor);
      ctx.putImageData(imageData, 0, 0);

      const newFillDataUrl = canvas.toDataURL();
      updateCanvasImage(newFillDataUrl);
      isDrawing.current = false;
      return;
    }

    // Setări comune pentru desenare
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth;

    // Setări specifice pentru gumă de șters sau alte unelte
    if (tool === TOOL_ERASER) {
      ctx.globalCompositeOperation = 'destination-out'; // Guma de șters șterge pixelii existenți
      ctx.globalAlpha = 1; // Opacitate maximă pentru gumă
    } else {
      ctx.globalCompositeOperation = 'source-over'; // Desenează peste pixelii existenți
      ctx.strokeStyle = color;
      // ACUM: pensula (TOOL_BRUSH) folosește opacitatea din slider
      ctx.globalAlpha = opacity; 
    }
    
    // Desenează un punct inițial la apăsare (pentru a asigura că se vede și un clic simplu)
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (tool !== TOOL_PEN) {
      ctx.lineTo(pos.x + 0.001, pos.y + 0.001); // Desenează un punct foarte mic
      ctx.stroke();
    }
    
    // Actualizează imaginea Konva
    konvaDrawingImageRef.current.src = canvas.toDataURL();
  };

  // Handler pentru evenimentul de mișcare a mouse-ului
  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setCursorPos(pos);

    if (!isDrawing.current || !lastPos.current) return; // Ieși dacă nu se desenează

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
      ctx.lineWidth = strokeWidth; // Setăm strokeWidth aici pentru toate uneltele
      // ACUM: globalAlpha este setat la valoarea din slider pentru toate uneltele de desenat (inclusiv pensula)
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
          // Opacitatea fiecărui cerc individual al pensulei este o fracțiune din opacitatea totală
          // pentru a menține efectul de "pulverizare"
          ctx.globalAlpha = opacity * 0.2; // Ex: 20% din opacitatea totală pentru fiecare cerc
          ctx.fill();
        }
        // Restabilim opacitatea globală la valoarea din slider pentru desenul următor
        ctx.globalAlpha = opacity; 

      } else if (tool === TOOL_PEN) {
        const lastX = lastPos.current.x;
        const lastY = lastPos.current.y;
        const dx = pos.x - lastX;
        const dy = pos.y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let newWidth = strokeWidth - dist / 5; // Simulează presiunea (lățime variabilă)
        if (newWidth < 1) newWidth = 1;
        if (newWidth > strokeWidth) newWidth = strokeWidth;
        
        if (dist > 1) { 
          ctx.lineWidth = newWidth;
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
        // Opacitatea sliderului este aplicată pentru stilou
        ctx.globalAlpha = opacity;
      } else {
        // Logică standard pentru creion
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        // Opacitatea sliderului este aplicată pentru creion
        ctx.globalAlpha = opacity;
      }
    }
    
    lastPos.current = pos; // Actualizează ultima poziție
    konvaDrawingImageRef.current.src = canvas.toDataURL(); // Actualizează imaginea Konva
  }, [tool, strokeWidth, color, opacity]);

  // Handler pentru evenimentul de eliberare a mouse-ului
  const handleMouseUp = useCallback(() => {
    isDrawing.current = false; // Oprește desenarea
    
    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    // Resetăm operația de compozitare și opacitatea globală
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    
    // Asigură că stiloul desenează un punct chiar și la un clic simplu
    if (lastPos.current && tool === TOOL_PEN) {
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(lastPos.current.x + 0.001, lastPos.current.y + 0.001);
      ctx.stroke();
    }
    
    lastPos.current = null; // Resetează ultima poziție
    updateCanvasImage(canvas.toDataURL()); // Salvează starea finală a canvasului
  }, [updateCanvasImage, tool, strokeWidth]);

  // Handler pentru funcția Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prevImageData = history[history.length - 1]; // Ia ultima stare din istoric

    setRedoStack((r) => [currentCanvasDataUrl, ...r]); // Adaugă starea curentă în redo
    setCurrentCanvasDataUrl(prevImageData); // Revino la starea anterioară
    konvaDrawingImageRef.current.src = prevImageData; // Actualizează imaginea Konva
    setHistory((h) => h.slice(0, -1)); // Elimină ultima stare din istoric
  }, [history, currentCanvasDataUrl]);

  // Handler pentru funcția Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [nextImageData, ...rest] = redoStack; // Ia prima stare din redo

    setHistory((h) => [...h, currentCanvasDataUrl]); // Adaugă starea curentă în istoric
    setCurrentCanvasDataUrl(nextImageData); // Aplică starea din redo
    konvaDrawingImageRef.current.src = nextImageData; // Actualizează imaginea Konva
    setRedoStack(rest); // Elimină starea din redo
  }, [redoStack, currentCanvasDataUrl]);

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

  // Listener pentru combinații de taste (Ctrl+Z pentru undo, Ctrl+Shift+Z pentru redo)
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

  // Obiectul pasului curent din ghid
  const step = steps[currentStep] || {};

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50">
      {/* Canvas ascuns folosit pentru desenarea efectivă (context 2D) */}
      <canvas
        ref={hiddenCanvasRef}
        width={500}
        height={500}
        style={{ display: "none" }}
      />
      <div>
        {/* Secțiunea de butoane pentru unelte și Undo/Redo/Reset */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {[TOOL_PENCIL, TOOL_BRUSH, TOOL_PEN, TOOL_ERASER, TOOL_BUCKET].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTool(t);
                isDrawing.current = false; // Oprește desenarea la schimbarea uneltei
              }}
              className={`px-4 py-2 rounded border ${
                tool === t ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}

          <button onClick={handleUndo} className="px-4 py-2 rounded bg-yellow-500 text-white" disabled={history.length === 0}>
            Undo
          </button>
          <button onClick={handleRedo} className="px-4 py-2 rounded bg-green-600 text-white" disabled={redoStack.length === 0}>
            Redo
          </button>

          <button
            onClick={() => {
              setCurrentCanvasDataUrl(""); // Golește canvasul
              setHistory([]); // Golește istoricul
              setRedoStack([]); // Golește redo stack-ul
              konvaDrawingImageRef.current = new window.Image(); // Resetează imaginea Konva
            }}
            className="ml-auto px-4 py-2 rounded bg-red-600 text-white"
          >
            Reset
          </button>
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
          {/* Stratul pentru imaginea de ghid (overlay) */}
          <Layer>
            {showOverlay && overlayImage && (
              <KonvaImage image={overlayImage} width={500} height={500} opacity={0.3} />
            )}
          </Layer>
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

        {/* Butoane pentru navigația prin pașii ghidului și opțiunea overlay */}
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

      {/* Secțiunea de descriere a pasului curent */}
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
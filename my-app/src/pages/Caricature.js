import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas';

const Caricature = ({ socket, players, room, ownNickname, endTime }) => {
  // Definim state și ref-uri
  const [timeLeft, setTimeLeft] = useState(() =>
    endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 5
  );
  const [drawings, setDrawings] = useState({});
  // Pentru capturarea URI-ului desenului curent
  const [drawingUrl, setDrawingUrl] = useState(null);
  const canvasRef = useRef();
  const emittedRef = useRef(false);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(384);

  // Prevent page scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Synced countdown using requestAnimationFrame for endTime
  useEffect(() => {
    if (!endTime) return;
    setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    let animationFrame;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) {
        animationFrame = requestAnimationFrame(updateTimer);
      }
    };
    animationFrame = requestAnimationFrame(updateTimer);
    return () => cancelAnimationFrame(animationFrame);
  }, [endTime]);

  // Local countdown fallback if no endTime provided
  useEffect(() => {
    if (endTime) return;
    const localTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(localTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(localTimer);
  }, [endTime]);

  // Receive caricature results
  useEffect(() => {
    const handler = payload => {
      console.log(`[CLIENT][caricature_result] got payload:`, payload);
      setDrawings(prev => ({ ...prev, [payload.nickname]: payload.drawing }));
    };
    console.log("[CLIENT] registering caricature_result handler");
    socket.on('caricature_result', handler);
    return () => socket.off('caricature_result', handler);
  }, [socket]);

    // Emiterea desenului propriu la final de rundă și export
  useEffect(() => {
    if (timeLeft === 0 && !emittedRef.current) {
      // exportă imaginea desenată
      const url = canvasRef.current?.handleExport();
      console.log(`[CLIENT][export] time's up, exporting image:`, url?.substring(0,50) + "…");
      // actualizează drawingUrl pentru afișare imediată
      if (url) setDrawingUrl(url);
      // emite payload-ul cu desenul exportat
      socket.emit('caricature_result', { nickname: ownNickname, drawing: url });
      console.log(`[CLIENT] emitted caricature_result for ${ownNickname}`);
      emittedRef.current = true;
    }
  }, [timeLeft, ownNickname, socket]);

    // --- renderizarea componentei ---
  const roundOver = timeLeft <= 0;
  const allDrawingsReceived = players.list.every(nick => drawings[nick]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Zona de desenat sau afișare caricatură proprie */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {!roundOver ? (
          <Canvas ref={canvasRef} canvasSize={canvasSize} onChange={setDrawingUrl} />
        ) : (
          <img
            src={drawings[ownNickname] || drawingUrl}
            alt="Caricatura ta"
            className="w-full h-full rounded shadow border"
          />
        )}
      </div>

      {/* Zona de caricaturi finale: așteaptă ca ambii să trimită */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 mt-24">
        {roundOver && !allDrawingsReceived ? (
          <p className="text-xl font-medium">Aștept până toată lumea trimite caricatura...</p>
        ) : (!roundOver ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Trăsături ({timeLeft}s)</h2>
            <ul className="list-disc list-inside space-y-2 flex-1 mb-4 w-full">
              {Object.entries(players.traits).map(([trait, value]) => (
                <li key={trait} className="text-lg">
                  <strong>{trait}:</strong> {value}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full h-full">
            {players.list.map(nick => (
              <div key={nick} className="flex flex-col items-center">
                <img
                  src={drawings[nick]}
                  alt={`${nick} caricature`}
                  className="w-full h-auto max-h-full rounded shadow border"
                />
                <p className="mt-2 text-lg font-medium">{nick}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Caricature;

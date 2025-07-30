import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas';

const Caricature = ({ socket, players, room, ownNickname, endTime }) => {
  // Initialize synced timeLeft based on endTime or fallback to 60s
  const [timeLeft, setTimeLeft] = useState(() =>
    endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 60
  );
  const [drawings, setDrawings] = useState({});
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
    // Initialize immediately
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
      setTimeLeft((prev) => {
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
    const handler = (payload) => {
      setDrawings((prev) => ({ ...prev, [payload.nickname]: payload.drawing }));
    };
    socket.on('caricature_result', handler);
    return () => {
      socket.off('caricature_result', handler);
    };
  }, [socket]);

  const roundOver = timeLeft <= 0;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Zona de desenat sau afișare caricatură proprie */}
      <div
        className="flex-1 flex items-center justify-center bg-gray-100"
        ref={containerRef}
      >
        {!roundOver ? (
          <Canvas canvasSize={canvasSize} />
        ) : (
          <img
            src={drawings[ownNickname]}
            alt="Caricatura ta"
            className="w-full h-full rounded shadow border"
          />
        )}
      </div>

      {/* Zona de caricaturi finale: două imagini */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 mt-24">
        {!roundOver ? (
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
            {players.list.map((nick) => (
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
        )}
      </div>
    </div>
  );
};

export default Caricature;

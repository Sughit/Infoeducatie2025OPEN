import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas';

const Caricature = ({ endTime }) => {
  const [traits, setTraits] = useState({});
  const [traitsError, setTraitsError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(
    endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 60
  );
  const [drawingUrl, setDrawingUrl] = useState(null);
  const canvasRef = useRef();

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Fetch traits folosind origin corect (evită primirea HTML)
  useEffect(() => {
    const fetchTraits = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SOCKET_URL}api/traits`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setTraits(data);
      } catch (err) {
        console.error('Eroare la încărcare trăsături:', err);
        setTraitsError(err);
      }
    };
    fetchTraits();
  }, []);

  useEffect(() => {
    if (!endTime) return;
    let animationFrame;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) animationFrame = requestAnimationFrame(updateTimer);
    };
    updateTimer();
    return () => cancelAnimationFrame(animationFrame);
  }, [endTime]);

  useEffect(() => {
    if (endTime) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  useEffect(() => {
    if (timeLeft === 0 && !drawingUrl) {
      const url = canvasRef.current?.handleExport();
      if (url) setDrawingUrl(url);
    }
  }, [timeLeft, drawingUrl]);

  const roundOver = timeLeft <= 0;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        {!roundOver ? (
          <Canvas ref={canvasRef} canvasSize={384} onChange={setDrawingUrl} />
        ) : (
          <img
            src={drawingUrl}
            alt="Caricatura ta"
            className="w-full h-full rounded shadow border"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 mt-24">
        {!roundOver && (
          <>
            <h2 className="text-2xl font-bold mb-4">Trăsături ({timeLeft}s)</h2>
            {traitsError ? (
              <p className="text-red-600">Eroare la încărcare trăsături.</p>
            ) : (
              <ul className="list-disc list-inside space-y-2 flex-1 mb-4 w-full">
                {Object.entries(traits).map(([trait, values]) => (
                  <li key={trait} className="text-lg">
                    <strong>{trait}:</strong> {Array.isArray(values) ? values.join(', ') : values}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {roundOver && (
          <p className="text-xl font-medium">Timpul s-a încheiat, iată caricatura ta!</p>
        )}
      </div>
    </div>
  );
};

export default Caricature;

import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../components/Canvas';

// Helper to join base URL and endpoint with exactly one slash
function joinUrl(base = '', endpoint = '') {
  return `${base.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
}

const Realistic = ({ endTime }) => {

  const [portraitPath, setPortraitPath] = useState('');
  const [portraitError, setPortraitError] = useState(null);
  const [loadingPortrait, setLoadingPortrait] = useState(true);

  const [timeLeft, setTimeLeft] = useState(
    endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 30
  );
  const [drawingUrl, setDrawingUrl] = useState(null);
  const canvasRef = useRef();


  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  // Fetch random portrait on mount
  useEffect(() => {
    const fetchPortrait = async () => {
      try {
        const base = process.env.REACT_APP_SOCKET_URL || '';
        const response = await fetch(joinUrl(base, '/api/portret'));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const fileName = data.image.split('/').pop();
        setPortraitPath(joinUrl(base, `/portret/${fileName}`));
      } catch (err) {
        console.error('Eroare la încărcare portret:', err);
        setPortraitError(err);
      } finally {
        setLoadingPortrait(false);
      }
    };
    fetchPortrait();
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
      {/* Drawing area */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
  <Canvas
    ref={canvasRef}
    canvasSize={384}
    onChange={setDrawingUrl}
    isDrawingEnabled={!roundOver}
  />
</div>

      {/* Portrait and timer info */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 mt-24">
        {!roundOver && (
          <>
            <h2 className="text-2xl font-bold mb-4">Imagine Portret ({timeLeft}s)</h2>
            {loadingPortrait ? (
              <p>Se încarcă portretul...</p>
            ) : portraitError ? (
              <p className="text-red-600">Eroare la încărcare portret.</p>
            ) : (
              <img
                src={portraitPath}
                alt="Portret aleator"
                className="max-w-full max-h-64 rounded shadow"
              />
            )}
          </>
        )}

        {roundOver && (
          <p className="text-xl font-medium">Timpul s-a încheiat, ai desenat portretul!</p>
        )}
      </div>
    </div>
  );
};

export default Realistic;

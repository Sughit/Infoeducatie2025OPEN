import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Canvas from "../components/Canvas";

function joinUrl(base = '', endpoint = '') {
  return `${base.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
}

const Eye = () => {
  const base = process.env.REACT_APP_SOCKET_URL || '';

  // State for eye-images list
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [imageWidth, setImageWidth] = useState(384);
  const imageRef = useRef(null);

  // Fetch eye-images on mount
  useEffect(() => {
    fetch(joinUrl(base, 'api/eye-images'))
      .then(res => res.json())
      .then(data => setImages(data))
      .catch(err => console.error('Eroare la încărcare imagini:', err));
  }, [base]);

  useEffect(() => {
    function updateSize() {
      if (imageRef.current) {
        setImageWidth(imageRef.current.offsetWidth);
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [index, images]);

  const nextImage = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const currentImage = images[index]
    ? `${base}sketches/eye/${images[index]}`
    : null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#E6E6E6]">
      {/* Canvas stânga */}
      <div className="md:w-1/2 w-full flex items-center justify-center border-r border-gray-300">
        <Canvas canvasSize={imageWidth} />
      </div>

      {/* Carusel dreapta */}
      <div className="md:w-1/2 w-full flex flex-col items-center justify-center p-6 bg-white shadow-inner">
        <h2 className="text-2xl font-bold mb-6 text-[#297373] tracking-wide">
          Exemplu {index + 1}/{images.length}
        </h2>

        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.img
              key={currentImage}
              ref={imageRef}
              src={currentImage}
              alt={`eye ${index + 1}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md h-auto rounded-xl shadow-lg border border-gray-200 mb-6"
              onLoad={() => {
                if (imageRef.current)
                  setImageWidth(imageRef.current.offsetWidth);
              }}
            />
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <button
            onClick={prevImage}
            className="px-5 py-2 rounded-full font-semibold text-white bg-[#FF8552] hover:bg-[#e76d3d] transition transform hover:scale-105 shadow"
          >
            ⟵ Înapoi
          </button>
          <button
            onClick={nextImage}
            className="px-5 py-2 rounded-full font-semibold text-white bg-[#FF8552] hover:bg-[#e76d3d] transition transform hover:scale-105 shadow"
          >
            Înainte ⟶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Eye;

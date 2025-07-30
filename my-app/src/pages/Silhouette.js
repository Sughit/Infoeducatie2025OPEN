import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Silhouette = () => {
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  const baseURL = `${process.env.REACT_APP_SOCKET_URL}/sketches/silhouette`;

  useEffect(() => {
    fetch(`${process.env.REACT_APP_SOCKET_URL}/api/silhouette-images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((err) => console.error("Eroare la încărcare imagini:", err));
  }, []);

  const nextImage = () => {
    setIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const currentImage = images[index]
    ? `${baseURL}/${images[index]}`
    : null;

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Canvas în stânga */}
      <div className="md:w-1/2 w-full flex items-center justify-center bg-gray-100 border-r border-gray-200">
        <canvas
          id="silhouette-canvas"
          width={500}
          height={500}
          className="bg-white shadow-lg rounded border border-gray-300"
        />
      </div>

      {/* Carusel în dreapta */}
      <div className="md:w-1/2 w-full flex flex-col items-center justify-center bg-white p-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">
          Exemplu {index + 1}/{images.length}
        </h2>

        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={`silhouette ${index + 1}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }} 
              className="w-full max-w-md h-auto rounded shadow border border-gray-200 mb-4"
            />
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <button
            onClick={prevImage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ⟵ Înapoi
          </button>
          <button
            onClick={nextImage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Înainte ⟶
          </button>
        </div>
      </div>
    </div>
  );
};

export default Silhouette;

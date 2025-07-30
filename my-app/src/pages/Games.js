import React from 'react';
import { useNavigate } from 'react-router-dom';

const games = [
  {
    title: "Portret Realist",
    mode: "realistic",
    description: "Desenează un portret cât mai aproape de o imagine reală.",
  },
  {
    title: "Caricaturi",
    mode: "caricature",
    description: "Desenează o versiune amuzantă și exagerată a unei fețe.",
  },
];

const Games = () => {
  const navigate = useNavigate();

  const handleSelectGame = (mode) => {
    navigate(`/join?mode=${mode}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto mt-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Alege un mod de joc</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, index) => (
          <div
            key={index}
            onClick={() => handleSelectGame(game.mode)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:bg-blue-50 cursor-pointer transition"
          >
            <h2 className="text-xl font-semibold text-gray-800">{game.title}</h2>
            <p className="text-gray-600 mt-2">{game.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Games = () => {
  const navigate = useNavigate();
  // Inițializăm useTranslation pentru a avea acces la funcția t()
  const { t, i18n } = useTranslation(); 

  // Definim jocurile folosind chei de traducere
  const games = [
    {
      titleKey: "realistic",
      descriptionKey: "realistic_desc",
      mode: "realistic",
    },
    {
      titleKey: "caricature",
      descriptionKey: "caricature_desc",
      mode: "caricature",
    },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSelectGame = (mode) => {
    navigate(`/join?mode=${mode}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto mt-24">
      {/* Folosim t() pentru a traduce titlul paginii */}
      <h1 className="text-3xl font-bold mb-8 text-center">{t("choose_game")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, index) => (
          <div
            key={index}
            onClick={() => handleSelectGame(game.mode)}
            className="group bg-white rounded-2xl shadow-md p-8 hover:shadow-xl hover:bg-blue-50 cursor-pointer transition-transform transform hover:scale-105"
          >
            {/* Folosim t() cu cheile definite în array */}
            <h2 className="text-2xl font-bold text-blue-800 group-hover:text-blue-900">{t(game.titleKey)}</h2>
            <p className="text-gray-600 mt-3 text-base">{t(game.descriptionKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;   
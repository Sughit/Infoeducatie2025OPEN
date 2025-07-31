import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Games = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const games = [
    {
      titleKey: "realistic",
      descriptionKey: "realistic_desc",
      mode: "realistic",
      url: "/realistic",
    },
    {
      titleKey: "caricature",
      descriptionKey: "caricature_desc",
      mode: "caricature",
      url: "/caricature",
    },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleSelectGame = (url) => {
    navigate(url);
  };

  return (
    <div
      className="p-6 max-w-5xl mx-auto mt-24"
      style={{ backgroundColor: "#E6E6E6" }}
    >
      <h1
        className="text-3xl font-bold mb-8 text-center"
        style={{ color: "#297373" }}
      >
        {t("choose_game")}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game, index) => (
          <div
            key={index}
            onClick={() => handleSelectGame(game.url)}
            className="group rounded-2xl p-8 cursor-pointer transition-transform transform shadow-md"
            style={{ backgroundColor: "white", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FF8552";
              e.currentTarget.style.boxShadow = "0 8px 15px rgba(255,133,82,0.5)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <h2
              className="text-2xl font-bold mb-3 transition-colors duration-300"
              style={{ color: "#297373" }}
            >
              {t(game.titleKey)}
            </h2>
            <p className="text-gray-700 text-base">
              {t(game.descriptionKey)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Games;

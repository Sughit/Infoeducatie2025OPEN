import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { t, i18n } = useTranslation(); // Inițializăm hook-ul de traducere

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleScroll = (e, id) => {
    e.preventDefault();
    const el = containerRef.current.querySelector(`#${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto snap-y snap-mandatory h-screen scroll-smooth"
    >
      {/* HERO SECTION */}
      <section
        id="intro"
        className="snap-start h-screen bg-gradient-to-r from-blue-600 to-blue-300 flex justify-center items-center"
      >
        <div className="max-w-2xl w-full text-center px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
            {t("app_name")} – {t("hero_tagline")} {/* Traducem titlul și tagline-ul */}
          </h1>
          <p className="text-lg md:text-2xl text-white/80 mb-8">
            {t("hero_description")} {/* Traducem descrierea principală */}
          </p>
          <a
            href="#lessons"
            onClick={(e) => handleScroll(e, "lessons")}
            className="inline-block bg-white text-blue-700 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-white/90 transition"
          >
            {t("view_lessons")} {/* Traducem textul butonului */}
          </a>
        </div>
      </section>

      {/* LECȚII */}
      <section
        id="lessons"
        className="snap-start h-screen bg-white flex justify-center items-center"
      >
        <div className="w-full max-w-6xl text-center px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-blue-800 mb-8">{t("lessons_section_title")}</h2> {/* Traducem titlul secțiunii */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              // Folosim chei de traducere pentru titluri și descrieri
              { titleKey: "lesson_eye_title", descKey: "lesson_eye_desc" },
              { titleKey: "lesson_face_title", descKey: "lesson_face_desc" },
              { titleKey: "lesson_silhouette_title", descKey: "lesson_silhouette_desc" },
              { titleKey: "lesson_whole_title", descKey: "lesson_whole_desc" },
            ].map(({ titleKey, descKey }) => ( // Aici destructurăm titleKey și descKey
              <div
                key={titleKey} // Folosim titleKey ca cheie unică
                className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-left"
              >
                <h4 className="text-xl font-semibold text-blue-800 mb-2">{t(titleKey)}</h4> {/* Traducem titlul */}
                <p className="text-gray-700">{t(descKey)}</p> {/* Traducem descrierea */}
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/lessons")}
            className="mt-10 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            {t("access_lessons")} {/* Traducem textul butonului */}
          </button>
        </div>
      </section>

      {/* JOCURI */}
      <section
        id="games"
        className="snap-start h-screen bg-blue-100 flex justify-center items-center"
      >
        <div className="w-full max-w-5xl text-center px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-blue-900 mb-8">{t("games_section_title")}</h2> {/* Traducem titlul secțiunii */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                titleKey: "realistic_game_title",
                descKey: "realistic_game_desc",
                bulletsKeys: [
                  "realistic_bullet1",
                  "realistic_bullet2",
                ],
              },
              {
                titleKey: "caricature_game_title",
                descKey: "caricature_game_desc",
                bulletsKeys: [
                  "caricature_bullet1",
                  "caricature_bullet2",
                ],
              },
            ].map(({ titleKey, descKey, bulletsKeys }) => ( // Aici destructurăm titleKey, descKey și bulletsKeys
              <div
                key={titleKey} // Folosim titleKey ca cheie unică
                className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition text-left"
              >
                <h3 className="text-2xl font-bold text-blue-800 mb-3">{t(titleKey)}</h3> {/* Traducem titlul */}
                <p className="text-gray-700 mb-2">{t(descKey)}</p> {/* Traducem descrierea */}
                <ul className="list-disc pl-5 text-gray-600">
                  {bulletsKeys.map((bKey, i) => ( // Iterăm prin cheile pentru bullet points
                    <li key={i}>{t(bKey)}</li> // Traducem fiecare bullet point
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/games")}
            className="mt-10 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {t("start_game")} {/* Traducem textul butonului */}
          </button>
        </div>
      </section>
    </div>
  );
}
import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { t, i18n } = useTranslation();

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
      style={{ backgroundColor: "#E6E6E6" }}
    >
      {/* HERO SECTION - Fundal deschis #E6E6E6 cu text și accente #297373 */}
      <section
        id="intro"
        className="snap-start h-screen flex justify-center items-center"
      >
        <div className="max-w-3xl w-full text-center px-6">
          <h1
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-md"
            style={{ color: "#297373" }}
          >
            {t("app_name")} – {t("hero_tagline")}
          </h1>
          <p
            className="text-lg md:text-2xl mb-10 leading-relaxed"
            style={{ color: "#297373", opacity: 0.85 }}
          >
            {t("hero_description")}
          </p>
          <button
            onClick={(e) => handleScroll(e, "lessons")}
            className="inline-block font-bold py-4 px-10 rounded-full shadow-xl uppercase tracking-wide text-lg transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: "#FF8552",
              color: "white",
              boxShadow: "0 10px 15px rgba(255,133,82,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E9D758";
              e.currentTarget.style.color = "#297373";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(233,215,88,0.5)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FF8552";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(255,133,82,0.4)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {t("view_lessons")}
          </button>
        </div>
      </section>

      {/* SECȚIUNEA LECȚII - Fundal alb cu carduri în #297373 și titluri #FF8552 */}
      <section
        id="lessons"
        className="snap-start h-screen flex flex-col justify-center items-center py-16 px-6"
        style={{ backgroundColor: "white" }}
      >
        <div className="w-full max-w-7xl text-center">
          <h2
            className="text-4xl md:text-5xl font-extrabold mb-12"
            style={{ color: "#297373" }}
          >
            {t("lessons_section_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { titleKey: "lesson_eye_title", descKey: "lesson_eye_desc" },
              { titleKey: "lesson_face_title", descKey: "lesson_face_desc" },
              { titleKey: "lesson_silhouette_title", descKey: "lesson_silhouette_desc" },
              { titleKey: "lesson_whole_title", descKey: "lesson_whole_desc" },
            ].map(({ titleKey, descKey }) => (
              <div
                key={titleKey}
                className="rounded-2xl p-6 shadow-lg border border-gray-200 text-left transform transition-transform duration-300 ease-in-out hover:scale-105"
                style={{ backgroundColor: "#E6E6E6" }}
              >
                <h4
                  className="text-xl font-bold mb-3"
                  style={{ color: "#FF8552" }}
                >
                  {t(titleKey)}
                </h4>
                <p className="text-gray-800 leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/lessons")}
            className="mt-12 font-semibold px-8 py-4 rounded-full shadow-lg uppercase tracking-wide transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: "#297373",
              color: "white",
              boxShadow: "0 10px 15px rgba(41,115,115,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E9D758";
              e.currentTarget.style.color = "#297373";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(233,215,88,0.5)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#297373";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(41,115,115,0.4)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {t("access_lessons")}
          </button>
        </div>
      </section>

      {/* SECȚIUNEA JOCURI - Fundal #E6E6E6, carduri în alb cu titluri #297373 și butoane #FF8552 */}
      <section
        id="games"
        className="snap-start h-screen flex flex-col justify-center items-center py-16 px-6"
        style={{ backgroundColor: "#E6E6E6" }}
      >
        <div className="w-full max-w-7xl text-center">
          <h2
            className="text-4xl md:text-5xl font-extrabold mb-12"
            style={{ color: "#297373" }}
          >
            {t("games_section_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                titleKey: "realistic_game_title",
                descKey: "realistic_game_desc",
                bulletsKeys: ["realistic_bullet1", "realistic_bullet2"],
              },
              {
                titleKey: "caricature_game_title",
                descKey: "caricature_game_desc",
                bulletsKeys: ["caricature_bullet1", "caricature_bullet2"],
              },
            ].map(({ titleKey, descKey, bulletsKeys }) => (
              <div
                key={titleKey}
                className="rounded-2xl p-8 shadow-xl transition-transform duration-300 ease-in-out text-left transform hover:-translate-y-2 hover:shadow-2xl"
                style={{ backgroundColor: "white" }}
              >
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#297373" }}
                >
                  {t(titleKey)}
                </h3>
                <p className="text-gray-800 mb-4 leading-relaxed">{t(descKey)}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  {bulletsKeys.map((bKey, i) => (
                    <li key={i}>{t(bKey)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/games")}
            className="mt-12 font-semibold px-8 py-4 rounded-full shadow-lg uppercase tracking-wide transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: "#FF8552",
              color: "white",
              boxShadow: "0 10px 15px rgba(255,133,82,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E9D758";
              e.currentTarget.style.color = "#297373";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(233,215,88,0.5)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FF8552";
              e.currentTarget.style.color = "white";
              e.currentTarget.style.boxShadow = "0 10px 15px rgba(255,133,82,0.4)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {t("start_game")}
          </button>
        </div>
      </section>
    </div>
  );
}

import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

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
            ArtPortrait – Desenează și Învață
          </h1>
          <p className="text-lg md:text-2xl text-white/80 mb-8">
            Aplicație educativă și distractivă unde înveți să desenezi portrete și te joci cu prietenii în moduri creative.
          </p>
          <a
            href="#lessons"
            onClick={(e) => handleScroll(e, "lessons")}
            className="inline-block bg-white text-blue-700 font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-white/90 transition"
          >
            Vezi lecțiile
          </a>
        </div>
      </section>

      {/* LECȚII */}
      <section
        id="lessons"
        className="snap-start h-screen bg-white flex justify-center items-center"
      >
        <div className="w-full max-w-6xl text-center px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-blue-800 mb-8">📚 Lecții de desen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "👁️ Ochi", desc: "Învață umbrele și expresivitatea ochilor." },
              { title: "🙂 Fața", desc: "Proporții și simetrie facială." },
              { title: "🧍 Silueta", desc: "Conturul și postura corpului." },
              { title: "🖼️ Portret complet", desc: "Aplică totul într-un desen final." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-left"
              >
                <h4 className="text-xl font-semibold text-blue-800 mb-2">{title}</h4>
                <p className="text-gray-700">{desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/lessons")}
            className="mt-10 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Accesează lecțiile
          </button>
        </div>
      </section>

      {/* JOCURI */}
      <section
        id="games"
        className="snap-start h-screen bg-blue-100 flex justify-center items-center"
      >
        <div className="w-full max-w-5xl text-center px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-blue-900 mb-8">🎮 Moduri de joc</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "🧑‍🎨 Portret Realist",
                desc: "Desenează un portret după o fotografie reală.",
                bullets: [
                  "Primești o imagine aleatoare",
                  "Concentrează-te pe detalii",
                ],
              },
              {
                title: "😜 Caricatură",
                desc: "Creează personaje amuzante din trăsături aleatorii.",
                bullets: [
                  "Primești trăsături ca „ochi mari”, „nas lung”",
                  "Desenează creativ",
                ],
              },
            ].map(({ title, desc, bullets }) => (
              <div
                key={title}
                className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition text-left"
              >
                <h3 className="text-2xl font-bold text-blue-800 mb-3">{title}</h3>
                <p className="text-gray-700 mb-2">{desc}</p>
                <ul className="list-disc pl-5 text-gray-600">
                  {bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/games")}
            className="mt-10 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Începe un joc
          </button>
        </div>
      </section>
    </div>
  );
}

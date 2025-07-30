import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Importăm useTranslation

const Lectii = () => {
  const { t } = useTranslation(); // Inițializăm hook-ul de traducere

  // Definim lecțiile folosind chei de traducere pentru titlu și descriere
  const lessons = [
    {
      titleKey: 'eye', // Folosim cheile deja definite în JSON
      slug: 'eye',
      descriptionKey: 'eye_desc',
    },
    {
      titleKey: 'face',
      slug: 'face',
      descriptionKey: 'face_desc',
    },
    {
      titleKey: 'silhouette',
      slug: 'silhouette',
      descriptionKey: 'silhouette_desc',
    },
    {
      titleKey: 'whole',
      slug: 'whole',
      descriptionKey: 'whole_desc',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 px-4">
      {lessons.map((lesson, index) => (
        <Link
          to={`/lessons/${lesson.slug}`}
          key={index}
          className="group block bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:bg-indigo-50 transition-transform transform hover:scale-105"
        >
          {/* Folosim t() pentru a traduce titlul și descrierea */}
          <h2 className="text-xl font-bold text-indigo-700 group-hover:text-indigo-900">{t(lesson.titleKey)}</h2>
          <p className="text-gray-600 mt-2">{t(lesson.descriptionKey)}</p>
        </Link>
      ))}
    </div>
  );
};

export default Lectii;
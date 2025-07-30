import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Lectii = () => {
  const { t } = useTranslation();

  const lessons = [
    {
      titleKey: 'eye',
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
      titleKey: 'bust',
      slug: 'bust', // Changed slug to 'bust' for consistency
      descriptionKey: 'bust_desc',
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 px-4"
      style={{ backgroundColor: '#E6E6E6' }}
    >
      {lessons.map((lesson, index) => (
        <Link
          to={`/lessons/${lesson.slug}`}
          key={index}
          className="group block bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:scale-105 transition-transform transform"
          style={{ cursor: 'pointer' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#FF8552';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <h2
            className="text-xl font-bold mt-0 mb-2"
            style={{ color: '#297373' }}
          >
            {t(lesson.titleKey)}
          </h2>
          <p
            className="mt-2"
            style={{ color: '#4B5563' }}
          >
            {t(lesson.descriptionKey)}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default Lectii;
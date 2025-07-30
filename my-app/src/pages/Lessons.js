import React from 'react';
import { Link } from 'react-router-dom';

const lessons = [
  {
    title: 'Ochi',
    slug: 'eye',
    description: 'Învață să desenezi ochii realist, cu umbre și expresivitate.',
  },
  {
    title: 'Fața',
    slug: 'face',
    description: 'Descoperă proporțiile corecte ale feței umane.',
  },
  {
    title: 'Silueta',
    slug: 'silhouette',
    description: 'Exersează conturul corpului și poziționarea acestuia.',
  },
  {
    title: 'Întreg portretul',
    slug: 'whole',
    description: 'Combină tot ce ai învățat pentru a realiza un portret complet.',
  },
];

const Lectii = () => {
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
            {lesson.title}
          </h2>
          <p
            className="mt-2"
            style={{ color: '#4B5563' }} // echivalent text-gray-700
          >
            {lesson.description}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default Lectii;

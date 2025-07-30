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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 px-4">
      {lessons.map((lesson, index) => (
        <Link
          to={`/lessons/${lesson.slug}`}
          key={index}
          className="group block bg-white rounded-xl shadow-md p-6 hover:shadow-lg hover:bg-indigo-50 transition-transform transform hover:scale-105"
        >
          <h2 className="text-xl font-bold text-indigo-700 group-hover:text-indigo-900">{lesson.title}</h2>
          <p className="text-gray-600 mt-2">{lesson.description}</p>
        </Link>
      ))}
    </div>
  );
};

export default Lectii;

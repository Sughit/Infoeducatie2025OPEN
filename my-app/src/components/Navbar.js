import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* Nume aplicație */}
      <div className="text-2xl font-bold text-gray-800">
        <Link to="/" className="hover:text-blue-600 transition">ArtPortrait</Link>
      </div>

      {/* Butoane */}
      <div className="space-x-4">
        <Link
          to="/lessons"
          className="text-gray-700 hover:text-blue-600 font-medium transition"
        >
          Lecții
        </Link>
        <Link
          to="/games"
          className="text-gray-700 hover:text-blue-600 font-medium transition"
        >
          Jocuri
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;

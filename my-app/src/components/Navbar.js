import React from 'react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      {/* Nume aplicație */}
      <div className="text-2xl font-bold text-gray-800">
        ArtPortrait
      </div>

      {/* Butoane */}
      <div className="space-x-4">
        <button className="text-gray-700 hover:text-blue-600 font-medium">
          Lecții
        </button>
        <button className="text-gray-700 hover:text-blue-600 font-medium">
          Jocuri
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

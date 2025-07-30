import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="p-4 max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-800">
          <Link to="/" className="hover:text-blue-600 transition">ArtPortrait</Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/lessons" className="text-gray-700 hover:text-blue-600 font-medium transition">{t("lessons")}</Link>
          <Link to="/games" className="text-gray-700 hover:text-blue-600 font-medium transition">{t("games")}</Link>

          {/* Language switcher */}
          <div className="space-x-2 ml-4">
            <button onClick={() => changeLanguage('ro')} className="text-sm font-medium hover:underline">RO</button>
            <button onClick={() => changeLanguage('en')} className="text-sm font-medium hover:underline">EN</button>
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)} className="text-gray-700 hover:text-blue-600">
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2 bg-white shadow-inner">
          <Link
            to="/lessons"
            onClick={() => setOpen(false)}
            className="block text-gray-700 hover:text-blue-600 font-medium"
          >
            {t("lessons")}
          </Link>
          <Link
            to="/games"
            onClick={() => setOpen(false)}
            className="block text-gray-700 hover:text-blue-600 font-medium"
          >
            {t("games")}
          </Link>
          {/* Language switcher for mobile */}
          <div className="pt-2 flex gap-2">
            <button onClick={() => { changeLanguage('ro'); setOpen(false); }} className="text-sm font-medium hover:underline">RO</button>
            <button onClick={() => { changeLanguage('en'); setOpen(false); }} className="text-sm font-medium hover:underline">EN</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

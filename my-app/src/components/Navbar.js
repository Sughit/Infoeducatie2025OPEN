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
    <nav className="bg-[#E6E6E6] shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="p-4 max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold text-[#297373] transition-colors duration-200">
          <Link to="/" className="hover:text-[#FF8552] transition duration-200">ArtPortrait</Link>
        </div>

        {/* Desktop*/}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/lessons"
            className="font-semibold transition px-4 py-2 rounded-full text-white transform hover:scale-105 active:scale-95 duration-200"
            style={{
              backgroundColor: '#FF8552',
              boxShadow: '0 0 0 3px rgba(255, 133, 82, 0.5)',
            }}
          >
            {t("lessons")}
          </Link>

          <Link
            to="/games"
            className="font-semibold transition px-4 py-2 rounded-xl text-[#297373] transform hover:scale-105 active:scale-95 duration-200"
            style={{
              border: '2px solid #297373',
            }}
          >
            {t("games")}
          </Link>

          <Link
            to="/adminAuth"
            className="font-medium text-[#297373] hover:text-[#FF8552] transition duration-200 transform hover:scale-105 active:scale-95"
          >
            {t("Admin")}
          </Link>

          <div className="space-x-2 ml-4">
            <button
              onClick={() => changeLanguage('ro')}
              className="text-sm font-semibold text-[#297373] hover:underline transition transform hover:scale-105 active:scale-95 duration-200"
            >
              🇷🇴 RO
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className="text-sm font-semibold text-[#297373] hover:underline transition transform hover:scale-105 active:scale-95 duration-200"
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/*toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="text-[#297373] hover:text-[#FF8552] transition-transform transform hover:scale-105 active:scale-95 duration-200"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/*Dropdown */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-3 bg-[#E6E6E6] shadow-inner">
          <Link
            to="/lessons"
            onClick={() => setOpen(false)}
            className="block font-semibold px-4 py-2 rounded-full text-white transition transform hover:scale-105 active:scale-95 duration-200"
            style={{
              backgroundColor: '#FF8552',
              boxShadow: '0 0 0 3px rgba(255, 133, 82, 0.5)',
            }}
          >
            {t("lessons")}
          </Link>

          <Link
            to="/games"
            onClick={() => setOpen(false)}
            className="block font-semibold px-4 py-2 rounded-xl text-[#297373] transition transform hover:scale-105 active:scale-95 duration-200"
            style={{
              backgroundColor: '#E9D758',
              border: '2px solid #297373',
            }}
          >
            {t("games")}
          </Link>

          <Link
            to="/adminAuth"
            onClick={() => setOpen(false)}
            className="block font-semibold px-4 py-2 rounded-xl text-[#297373] transition transform hover:scale-105 active:scale-95 duration-200"
            style={{
              backgroundColor: '#E9D758',
              border: '2px solid #297373',
            }}
          >
            {t("Admin")}
          </Link>

          <div className="pt-2 flex gap-2">
            <button
              onClick={() => { changeLanguage('ro'); setOpen(false); }}
              className="text-sm font-semibold text-[#297373] hover:underline transition transform hover:scale-105 active:scale-95 duration-200"
            >
              🇷🇴 RO
            </button>
            <button
              onClick={() => { changeLanguage('en'); setOpen(false); }}
              className="text-sm font-semibold text-[#297373] hover:underline transition transform hover:scale-105 active:scale-95 duration-200"
            >
              🇬🇧 EN
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

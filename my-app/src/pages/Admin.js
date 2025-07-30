import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Admin() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/login');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      setPreview('');
      return;
    }
    const selected = files[0];
    setFile(selected);

    // Folosește FileReader pentru preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selected);

    setStatus('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Selectează mai întâi o imagine.');
      return;
    }
    const formData = new FormData();
    formData.append('portrait', file);
    try {
      const rawUrl = process.env.REACT_APP_SOCKET_URL || '';
      const baseUrl = rawUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/upload/portret`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setStatus('Imagine încărcată cu succes!');
      } else {
        setStatus('Eroare la încărcare.');
      }
    } catch {
      setStatus('Eroare de rețea.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Panou Admin</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Deconectare
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Încărcare Portret</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <label className="inline-block">
            <span className="px-6 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300 transition">
              Selectează imagine
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-4 max-h-48 rounded"
            />
          )}
          <button
            type="submit"
            className="mt-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Încarcă imagine
          </button>
        </form>
        {status && <p className="mt-4 text-gray-700">{status}</p>}
      </section>

      <p className="text-gray-800">
        Bine ai venit în panoul de administrare. Aici poți gestiona Conținut, Utilizatori și Setări.
      </p>
    </div>
  );
}

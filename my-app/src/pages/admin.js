// src/components/Signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Parolele nu coincid');
      return;
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Initialize an empty results document for this user
      await setDoc(doc(db, "results", uid), {
        createdAt: serverTimestamp(),
      });

      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Înregistrare</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
              required
            />
          </label>
          <label className="block">
            Parolă
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
              required
            />
          </label>
          <label className="block">
            Confirmă parola
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 w-full p-2 border rounded"
              required
            />
          </label>
          <button
            type="submit"
            className="w-full bg-blue text-white py-2 rounded hover:bg-light-blue transition"
          >
            Înregistrare
          </button>
        </form>
        <p className="mt-4 text-center">
          Ai deja cont?{' '}
          <Link to="/login" className="text-blue hover:underline">
            Conectează-te
          </Link>
        </p>
      </div>
    </div>
  );
}
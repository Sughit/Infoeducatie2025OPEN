import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      if (user.email === 'admin@example.com') {
        navigate('/admin/dashboard');
      } else {
        setError('Nu ai acces la panoul de administrare.');
      }
    } catch {
      setError('Email sau parolă incorectă.');
    }
  };

  return (
    <form onSubmit={handleLogin} /* …restul markup-ului… */>
      {/* campuri email, parolă, afișare error */}
    </form>
  );
}

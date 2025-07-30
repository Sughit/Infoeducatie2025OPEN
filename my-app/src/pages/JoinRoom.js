import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const JoinRoom = () => {
  const [roomName, setRoomName] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode"); 

  const [nickname, setNickname] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim() && nickname.trim()) {
      navigate(`/room/${roomName.trim()}?mode=${mode || 'default'}&nick=${nickname.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Intră într-o cameră</h1>
      {mode && (
        <p className="mb-4 text-gray-600">
          Mod selectat: <span className="font-semibold">{mode}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="p-2 border rounded w-64"
        />
        <input
          type="text"
          placeholder="Nume cameră"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="p-2 border rounded w-64"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Conectează-te
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;

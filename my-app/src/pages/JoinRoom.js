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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-xl"
      >
        <input
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg flex-1"
        />
        <input
          type="text"
          placeholder="Nume cameră"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg flex-1"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Conectează-te
        </button>
      </form>
    </div>
  );
}; 

export default JoinRoom;

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
const JoinRoom = () => {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation(); 

  const mode = searchParams.get("mode");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim() && nickname.trim()) {
      navigate(`/room/${roomName.trim()}?mode=${mode || 'default'}&nick=${nickname.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 bg-[#E6E6E6]">
      <h1 className="text-3xl font-bold mb-6 text-[#297373] tracking-wide text-center">
        {t("join_room")}
      </h1>

      {mode && (
        <p className="mb-6 text-gray-700 text-center">
          {t("selected_mode")}: <span className="font-semibold text-[#297373]">{t(mode)}</span>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl "
      >
        <input
          placeholder={t("nickname")}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg flex-1 shadow"
        />
        <input
          type="text"
          placeholder={t("room_name")}
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg flex-1 shadow"
        />
        <button
          type="submit"
          className="bg-[#FF8552] hover:bg-[#e76d3d] text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 shadow"
        >
          {t("join")}
        </button>
      </form>
    </div>
  );
};

export default JoinRoom;

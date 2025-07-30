import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../server/socket';

const Room = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'default';

  const [players, setPlayers] = useState([]);
  const [roomFull, setRoomFull] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const nickname = searchParams.get("nick") || "Anonim";

  console.log("Connected:", socket.id);


  useEffect(() => {
    socket.connect();
    socket.emit("join_room", { room: roomName, mode, nickname });

    socket.on("update_players", (data) => {
      setPlayers(data);
      if (data.length === 2) {
        setGameStarted(true);
      }
    });

    socket.on("room_full", () => {
      setRoomFull(true);
      setGameStarted(false);
    });

    socket.on("start_game", () => {
      setGameStarted(true);
    });

    return () => {
      socket.emit("leave_room", { room: roomName, mode });
      socket.disconnect();
      socket.off();
    };
  }, [roomName, mode, nickname]);

  if (roomFull) {
    return (
      <div className="p-6 text-center text-red-600">
        Camera este plină. Te rugăm să alegi alta.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Camera: {roomName}</h1>
      <p className="mb-2 text-gray-700">Jucători conectați: {players.length}/2</p>
      <ul className="list-disc pl-6 mt-2 text-gray-800">
        {players.map((name, idx) => (
          <li key={idx}>{name}</li>
        ))}
      </ul>

      {gameStarted ? (
        <div className="text-green-600 font-semibold text-xl mt-4">
          Jocul a început!
        </div>
      ) : (
        <p className="text-gray-600">Se așteaptă un alt jucător...</p>
      )}
    </div>
  );
};

export default Room;

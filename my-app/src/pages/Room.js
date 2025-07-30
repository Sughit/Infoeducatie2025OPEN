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

  const [gameData, setGameData] = useState(null);

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

    socket.on("start_game", (data) => {
      console.log("Received game data:", data);
      setGameStarted(true);
      setGameData(data); 
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
      {gameData?.mode === "caricature" && (
        <div className="mt-4 text-left bg-yellow-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-yellow-800 mb-2">Trăsături pentru caricatură:</h2>
          <ul className="list-disc pl-6 text-gray-800">
            {Object.entries(gameData.traits).map(([key, value], idx) => (
              <li key={idx}>
                <strong>{key}:</strong> {value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {gameData?.mode === "realistic" && (
        <div className="mt-4 text-left bg-blue-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-blue-800 mb-2">Imagine pentru portret realist:</h2>
          <img
            src={gameData.image}
            alt="Portret"
            className="max-w-xs rounded shadow-md border"
          />
        </div>
      )}
    </div>
  );
};

export default Room;

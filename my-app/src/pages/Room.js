import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { socket } from '../server/socket';
import Caricature from './Caricature';

const Room = () => {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const nickname = searchParams.get('nick') || 'Anonim';
  const mode = searchParams.get('mode') || 'default';

  const [players, setPlayers] = useState([]);
  const [roomFull, setRoomFull] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    // Connect to Replit server and join room
    socket.connect();
    socket.emit('join_room', { room: roomName, mode, nickname });

    // Handle updates
    socket.on('update_players', (list) => {
      setPlayers(list);
    });

    socket.on('room_full', () => {
      setRoomFull(true);
    });

    socket.on('start_game', (data) => {
      setGameData(data);
      setGameStarted(true);
    });

    return () => {
      socket.emit('leave_room', { room: roomName, mode });
      socket.off('update_players');
      socket.off('room_full');
      socket.off('start_game');
      socket.disconnect();
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
    <div className="p-6 max-w-4xl mx-auto">
      {!gameStarted && (
        <>
                <h1 className="text-2xl font-bold mb-4">Camera: {roomName}</h1>
      <p className="mb-2 text-gray-700">
        Jucători conectați: {players.length}/2
      </p>
        </>
      )}

      {/* Lista de jucători înainte de start */}
      {!gameStarted && (
        <ul className="flex gap-4 mt-2 flex-wrap text-gray-800">
          {players.map((name, idx) => (
            <li
              key={idx}
              className="px-3 py-1 bg-gray-200 rounded-full shadow-sm text-sm font-medium"
            >
              {name}
            </li>
          ))}
        </ul>
      )}

      {/* UI joc după start */}
      {gameStarted && mode === 'caricature' && gameData?.traits && (
        <Caricature
          socket={socket}
          players={{ list: players, traits: gameData.traits }}
          room={roomName}
          ownNickname={nickname}
          endTime={gameData.endTime}
        />
      )}

      {gameStarted && mode === 'realistic' && gameData?.image && (
        <div className="mt-6 text-center">
          <img
            src={gameData.image}
            alt="Portret"
            className="mx-auto max-w-xs rounded shadow-md border"
          />
          <p className="mt-2 text-lg font-medium">{nickname}</p>
        </div>
      )}

      {!gameStarted && players.length === 2 && (
        <p className="text-gray-600 mt-4">Începem jocul în curând...</p>
      )}
    </div>
  );
};

export default Room;

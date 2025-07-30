import { io } from "socket.io-client";

const url = process.env.REACT_APP_SOCKET_URL;

export const socket = io(url, {
  autoConnect: false, 
});

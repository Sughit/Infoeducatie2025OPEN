import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  transports: ["polling"],
  autoConnect: false,
});

socket.on("connect", () => console.log("connected, id=", socket.id));
socket.on("connect_error", (err) => console.error("connect_error:", err));
socket.on("disconnect", (reason) => console.warn("ℹdisconnect:", reason));

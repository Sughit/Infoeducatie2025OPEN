import { io } from "socket.io-client";

const SOCKET_URL = "https://46bd291c-eb21-4480-8a00-06dc2d3ed965-00-3an6l4em0odn9.janeway.replit.dev";

export const socket = io(SOCKET_URL, {
  autoConnect: false, 
});

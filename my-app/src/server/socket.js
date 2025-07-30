import { io } from "socket.io-client";

console.log("socket.js încărcat");

const socket = io("https://…janeway.replit.dev", {
  transports: ["polling"],
  autoConnect: true,  
});

socket.on("connect", () => console.log("✅ connected, id=", socket.id));
socket.on("connect_error", (err) => console.error("⚠️ connect_error:", err));
socket.on("disconnect", (reason) => console.warn("ℹ️ disconnect:", reason));

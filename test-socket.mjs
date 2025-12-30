import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: {
    token: "test-token", // This will fail auth but we can see if socket connects
  },
});

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
  
  // Try to join a game
  socket.emit("join_game", { gameId: 1 });
});

socket.on("connect_error", (error) => {
  console.log("❌ Connection error:", error.message);
});

socket.on("error", (error) => {
  console.log("❌ Socket error:", error);
});

socket.on("game_state", (data) => {
  console.log("📊 Received game_state:", data);
});

socket.on("move_made", (data) => {
  console.log("♟️  Received move_made:", data);
});

socket.on("player_joined", (data) => {
  console.log("👤 Player joined:", data);
});

setTimeout(() => {
  console.log("Closing connection");
  socket.close();
  process.exit(0);
}, 5000);

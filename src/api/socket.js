import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Update if backend URL changes

const socket = io(SOCKET_URL, {
    transports: ["websocket"], // Ensures fast and stable connection
    reconnection: true,
    reconnectionAttempts: 5,
});

export default socket;

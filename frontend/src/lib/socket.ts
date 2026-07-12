import { io, type Socket } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:8000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socket;
};

export const connectSocket = () => {
  const client = getSocket();

  if (!client.connected) {
    client.connect();
  }

  return client;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

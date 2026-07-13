import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { parseAuthUser } from "./auth";
import {
  emitChatUpdated,
  emitMessageDeleted,
  emitMessagePinned,
  emitMessageReaction,
  emitMessageUpdated,
  emitMessagesRead,
  emitNewMessage,
  getIO,
  setIO,
} from "./emitter";
import { registerSocketHandlers } from "./handlers";

export {
  emitChatUpdated,
  emitMessageDeleted,
  emitMessagePinned,
  emitMessageReaction,
  emitMessageUpdated,
  emitMessagesRead,
  emitNewMessage,
  getIO,
};

export const initSocket = (httpServer: HttpServer) => {
  const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

  const server = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  server.use(async (socket, next) => {
    const user = await parseAuthUser(socket);

    if (!user) {
      next(new Error("Authentication required"));
      return;
    }

    socket.data.user = user;
    next();
  });

  setIO(server);
  registerSocketHandlers(server);

  return server;
};

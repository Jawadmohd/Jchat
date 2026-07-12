import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const useSocketConnection = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
      return;
    }

    disconnectSocket();
  }, [isAuthenticated]);
};

import { useContext } from "react";
import { ChatUIContext } from "../contexts/chatUIContext";

export function useChatUI() {
  const context = useContext(ChatUIContext);

  if (!context) {
    throw new Error("useChatUI must be used within ChatUIProvider");
  }

  return context;
}

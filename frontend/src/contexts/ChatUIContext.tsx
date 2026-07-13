import { createContext, useContext, type ReactNode } from "react";
import { useHomePage, type HomePageState } from "../hooks/useHomePage";

const ChatUIContext = createContext<HomePageState | null>(null);

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const value = useHomePage();
  return <ChatUIContext.Provider value={value}>{children}</ChatUIContext.Provider>;
}

export function useChatUI() {
  const context = useContext(ChatUIContext);

  if (!context) {
    throw new Error("useChatUI must be used within ChatUIProvider");
  }

  return context;
}

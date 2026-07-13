import type { ReactNode } from "react";
import { useHomePage } from "../hooks/useHomePage";
import { ChatUIContext } from "./chatUIContext";

export function ChatUIProvider({ children }: { children: ReactNode }) {
  const value = useHomePage();
  return <ChatUIContext.Provider value={value}>{children}</ChatUIContext.Provider>;
}

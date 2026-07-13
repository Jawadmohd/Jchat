import { createContext } from "react";
import type { HomePageState } from "../hooks/useHomePage";

export const ChatUIContext = createContext<HomePageState | null>(null);

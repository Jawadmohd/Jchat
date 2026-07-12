import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetUsersQuery, useLogoutMutation } from "../features/auth/authApi";
import { useGetChatsQuery } from "../features/chat/chatApi";
import type { NavTab } from "../components/chat/NavRail";
import type { Chat, NewChatMode } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";
import { useChatInboxSync } from "./useChatInboxSync";
import { usePresence } from "./usePresence";

export function useHomePage() {
  const navigate = useNavigate();
  const { data: chats = [], isLoading: isLoadingChats } = useGetChatsQuery();
  const { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<NavTab>("chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [newChatMode, setNewChatMode] = useState<NewChatMode | null>(null);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const selectedUser = selectedChat?.otherParticipant ?? null;

  useChatInboxSync(selectedChatId);
  usePresence();

  const openChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileShowChat(true);
    setNewChatMode(null);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileShowChat(false);
    setNewChatMode(null);
  };

  const handleOpenNewChat = () => {
    setNewChatMode("picker");
    setMobileShowChat(false);
  };

  const handleCloseNewChat = () => {
    setNewChatMode(null);
  };

  const handleSelectNewChatMode = (mode: NewChatMode) => {
    setNewChatMode(mode);
  };

  const handleBackToNewChatPicker = () => {
    setNewChatMode("picker");
  };

  const handleSelectChat = (chat: Chat) => {
    openChat(chat.id);
  };

  const handleSelectChatById = (chatId: string) => {
    openChat(chatId);
  };

  const handleChatStarted = () => {
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
    setSelectedChatId(null);
  };

  const handleLogout = async () => {
    try {
      const response = await logout().unwrap();
      toast.success(response.message);
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    }
  };

  return {
    activeTab,
    chats,
    users,
    isLoadingChats,
    isLoadingUsers,
    isLoggingOut,
    selectedChatId,
    selectedChat,
    selectedUser,
    mobileShowChat,
    newChatMode,
    showNewChat: newChatMode !== null,
    hideMobileNav: mobileShowChat || newChatMode !== null,
    handleTabChange,
    handleOpenNewChat,
    handleCloseNewChat,
    handleSelectNewChatMode,
    handleBackToNewChatPicker,
    handleSelectChat,
    handleSelectChatById,
    handleChatStarted,
    handleBackToList,
    handleLogout,
  };
}

export type HomePageState = ReturnType<typeof useHomePage>;

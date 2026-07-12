import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetUsersQuery, useLogoutMutation } from "../features/auth/authApi";
import { useGetChatsQuery } from "../features/chat/chatApi";
import type { NavTab } from "../components/chat/NavRail";
import type { Chat } from "../types/api";
import { getErrorMessage } from "../utils/getErrorMessage";

export function useHomePage() {
  const navigate = useNavigate();
  const { data: chats = [], isLoading: isLoadingChats } = useGetChatsQuery();
  const { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<NavTab>("chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? null,
    [chats, selectedChatId]
  );

  const selectedUser = selectedChat?.otherParticipant ?? null;

  const openChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileShowChat(true);
    setShowNewChat(false);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileShowChat(false);
    setShowNewChat(false);
  };

  const handleOpenNewChat = () => {
    setShowNewChat(true);
    setMobileShowChat(false);
  };

  const handleCloseNewChat = () => {
    setShowNewChat(false);
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
    selectedUser,
    mobileShowChat,
    showNewChat,
    hideMobileNav: mobileShowChat || showNewChat,
    handleTabChange,
    handleOpenNewChat,
    handleCloseNewChat,
    handleSelectChat,
    handleSelectChatById,
    handleChatStarted,
    handleBackToList,
    handleLogout,
  };
}

export type HomePageState = ReturnType<typeof useHomePage>;

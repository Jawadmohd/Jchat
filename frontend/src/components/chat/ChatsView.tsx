import type { HomePageState } from "../../hooks/useHomePage";
import ChatConversation from "./ChatConversation";
import ChatSidebar from "./ChatSidebar";
import { ChatMainPanelContainer } from "./ChatMainPanel";
import NewChatOverlay from "./NewChatOverlay";

type ChatsViewProps = Pick<
  HomePageState,
  | "chats"
  | "users"
  | "isLoadingChats"
  | "isLoadingUsers"
  | "isLoggingOut"
  | "selectedChatId"
  | "selectedUser"
  | "mobileShowChat"
  | "showNewChat"
  | "handleOpenNewChat"
  | "handleCloseNewChat"
  | "handleSelectChat"
  | "handleSelectChatById"
  | "handleChatStarted"
  | "handleBackToList"
  | "handleLogout"
>;

export default function ChatsView({
  chats,
  users,
  isLoadingChats,
  isLoadingUsers,
  isLoggingOut,
  selectedChatId,
  selectedUser,
  mobileShowChat,
  showNewChat,
  handleOpenNewChat,
  handleCloseNewChat,
  handleSelectChat,
  handleSelectChatById,
  handleChatStarted,
  handleBackToList,
  handleLogout,
}: ChatsViewProps) {
  const hideSidebarOnMobile = mobileShowChat && !showNewChat;
  const showMobileConversation = mobileShowChat && !!selectedUser && !showNewChat;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col lg:flex-row">
      <div
        className={`h-full w-full shrink-0 lg:w-auto ${
          hideSidebarOnMobile ? "hidden lg:block" : "block"
        }`}
      >
        <ChatSidebar
          chats={chats}
          isLoadingChats={isLoadingChats}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onOpenNewChat={handleOpenNewChat}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
      </div>

      {showMobileConversation && selectedUser && selectedChatId && (
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col lg:hidden">
          <ChatConversation
            chatId={selectedChatId}
            user={selectedUser}
            onBack={handleBackToList}
          />
        </main>
      )}

      <ChatMainPanelContainer
        className="hidden lg:flex"
        showNewChat={showNewChat}
        selectedChatId={selectedChatId}
        selectedUser={selectedUser}
        users={users}
        isLoadingUsers={isLoadingUsers}
        onCloseNewChat={handleCloseNewChat}
        onChatStarted={handleChatStarted}
        onSelectChatById={handleSelectChatById}
        onBackToList={handleBackToList}
      />

      {showNewChat && (
        <NewChatOverlay
          users={users}
          isLoading={isLoadingUsers}
          onClose={handleCloseNewChat}
          onChatStarted={handleChatStarted}
          onSelectChat={handleSelectChatById}
        />
      )}
    </div>
  );
}

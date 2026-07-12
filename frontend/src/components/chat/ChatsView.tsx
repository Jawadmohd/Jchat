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
  | "selectedChat"
  | "mobileShowChat"
  | "newChatMode"
  | "showNewChat"
  | "handleOpenNewChat"
  | "handleCloseNewChat"
  | "handleSelectNewChatMode"
  | "handleBackToNewChatPicker"
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
  selectedChat,
  mobileShowChat,
  newChatMode,
  showNewChat,
  handleOpenNewChat,
  handleCloseNewChat,
  handleSelectNewChatMode,
  handleBackToNewChatPicker,
  handleSelectChat,
  handleSelectChatById,
  handleChatStarted,
  handleBackToList,
  handleLogout,
}: ChatsViewProps) {
  const hideSidebarOnMobile = mobileShowChat && !showNewChat;
  const showMobileConversation = mobileShowChat && !!selectedChat && !showNewChat;

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

      {showMobileConversation && selectedChat && selectedChatId && (
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col lg:hidden">
          <ChatConversation
            chatId={selectedChatId}
            chat={selectedChat}
            onBack={handleBackToList}
          />
        </main>
      )}

      <ChatMainPanelContainer
        className="hidden lg:flex"
        newChatMode={newChatMode}
        selectedChatId={selectedChatId}
        selectedChat={selectedChat}
        users={users}
        isLoadingUsers={isLoadingUsers}
        onCloseNewChat={handleCloseNewChat}
        onSelectNewChatMode={handleSelectNewChatMode}
        onBackToNewChatPicker={handleBackToNewChatPicker}
        onChatStarted={handleChatStarted}
        onSelectChatById={handleSelectChatById}
        onBackToList={handleBackToList}
      />

      {newChatMode && (
        <NewChatOverlay
          mode={newChatMode}
          users={users}
          isLoading={isLoadingUsers}
          onClose={handleCloseNewChat}
          onSelectMode={handleSelectNewChatMode}
          onBackToPicker={handleBackToNewChatPicker}
          onChatStarted={handleChatStarted}
          onSelectChat={handleSelectChatById}
        />
      )}
    </div>
  );
}

import { useChatUI } from "../../contexts/ChatUIContext";
import ChatConversation from "./ChatConversation";
import ChatSidebar from "./ChatSidebar";
import { ChatMainPanelContainer } from "./ChatMainPanel";
import NewChatOverlay from "./NewChatOverlay";

export default function ChatsView() {
  const {
    chats,
    isLoadingChats,
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
    handleLeftGroup,
    handleLogout,
  } = useChatUI();

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
            onLeftGroup={handleLeftGroup}
          />
        </main>
      )}

      <ChatMainPanelContainer
        className="hidden lg:flex"
        newChatMode={newChatMode}
        selectedChatId={selectedChatId}
        selectedChat={selectedChat}
        onCloseNewChat={handleCloseNewChat}
        onSelectNewChatMode={handleSelectNewChatMode}
        onBackToNewChatPicker={handleBackToNewChatPicker}
        onChatStarted={handleChatStarted}
        onSelectChatById={handleSelectChatById}
        onBackToList={handleBackToList}
        onLeftGroup={handleLeftGroup}
      />

      {newChatMode && (
        <NewChatOverlay
          mode={newChatMode}
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

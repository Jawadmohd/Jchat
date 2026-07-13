import { useChatUI } from "../../hooks/useChatUI";
import { useIsMobileChatView } from "../../hooks/useIsMobileChatView";
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

  const isMobileChatView = useIsMobileChatView();
  const hideSidebarOnMobile = isMobileChatView && mobileShowChat && !showNewChat;
  const hasSelectedChat = !!selectedChat && !!selectedChatId && !showNewChat;
  const showMobileConversation = isMobileChatView && mobileShowChat && hasSelectedChat;
  const highlightedChatId =
    showNewChat || (isMobileChatView && !mobileShowChat) ? null : selectedChatId;

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
          selectedChatId={highlightedChatId}
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
        selectedChatId={hasSelectedChat ? selectedChatId : null}
        selectedChat={hasSelectedChat ? selectedChat : null}
        isMobileLayout={isMobileChatView}
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

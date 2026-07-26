import { useCallback, useState } from "react";
import type { Chat } from "../../types/api";
import { useChatConversation } from "../../hooks/useChatConversation";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatSearchBar from "./ChatSearchBar";
import GroupSettingsPanel from "./GroupSettingsPanel";
import MessageList from "./MessageList";
import PinnedMessagesBar from "./PinnedMessagesBar";

interface ChatConversationProps {
  chat: Chat;
  chatId: string;
  onBack: () => void;
  onLeftGroup?: () => void;
}

export default function ChatConversation({ chatId, chat, onBack, onLeftGroup }: ChatConversationProps) {
  const {
    user,
    chatWithPresence,
    messages,
    pinnedMessages,
    isLoading,
    hasMore,
    isLoadingOlder,
    isSending,
    replyingTo,
    showGroupSettings,
    typingUsername,
    setReplyingTo,
    setShowGroupSettings,
    handleLoadOlder,
    handleSend,
    handleSendFile,
    handleEditMessage,
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    handleToggleReaction,
    emitTypingStart,
    emitTypingStop,
  } = useChatConversation(chatId, chat);

  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleJumpToMessage = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatHeader
        chat={chatWithPresence}
        onBack={onBack}
        showBackButton
        typingUsername={typingUsername}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenGroupSettings={
          chat.type === "group" ? () => setShowGroupSettings(true) : undefined
        }
      />
      {searchOpen && (
        <ChatSearchBar
          chatId={chatId}
          messages={messages}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={handleLoadOlder}
          onJumpToMessage={handleJumpToMessage}
          onClose={() => {
            setSearchOpen(false);
            setHighlightedMessageId(null);
          }}
        />
      )}
      <PinnedMessagesBar messages={pinnedMessages} currentUserId={user?.id} />
      <div className="min-h-0 flex-1 overflow-hidden bg-primary">
        <MessageList
          chat={chatWithPresence}
          messages={messages}
          isLoading={isLoading}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          highlightedMessageId={highlightedMessageId}
          onLoadOlder={() => void handleLoadOlder()}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={setReplyingTo}
          onPinMessage={handlePinMessage}
          onUnpinMessage={handleUnpinMessage}
          onToggleReaction={handleToggleReaction}
        />
      </div>
      <ChatInput
        onSend={handleSend}
        onSendFile={handleSendFile}
        onTypingStart={emitTypingStart}
        onTypingStop={emitTypingStop}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={isSending}
      />

      {showGroupSettings && chat.type === "group" && (
        <GroupSettingsPanel
          chat={chatWithPresence}
          onClose={() => setShowGroupSettings(false)}
          onLeftGroup={() => {
            setShowGroupSettings(false);
            onLeftGroup?.();
          }}
        />
      )}
    </div>
  );
}

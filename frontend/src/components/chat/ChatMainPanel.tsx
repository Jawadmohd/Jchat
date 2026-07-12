import type { Chat, NewChatMode } from "../../types/api";
import type { User } from "../../types/api";
import ChatConversation from "./ChatConversation";
import ChatEmptyState from "./ChatEmptyState";
import NewChatPanel from "./NewChatPanel";
import NewChatPicker from "./NewChatPicker";
import NewGroupPanel from "./NewGroupPanel";

interface ChatMainPanelProps {
  newChatMode: NewChatMode | null;
  selectedChatId: string | null;
  selectedChat: Chat | null;
  users: User[];
  isLoadingUsers: boolean;
  onCloseNewChat: () => void;
  onSelectNewChatMode: (mode: NewChatMode) => void;
  onBackToNewChatPicker: () => void;
  onChatStarted: () => void;
  onSelectChatById: (chatId: string) => void;
  onBackToList: () => void;
}

export default function ChatMainPanel({
  newChatMode,
  selectedChatId,
  selectedChat,
  users,
  isLoadingUsers,
  onCloseNewChat,
  onSelectNewChatMode,
  onBackToNewChatPicker,
  onChatStarted,
  onSelectChatById,
  onBackToList,
}: ChatMainPanelProps) {
  if (newChatMode === "picker") {
    return (
      <NewChatPicker
        onSelect={onSelectNewChatMode}
        onClose={onCloseNewChat}
        variant="panel"
      />
    );
  }

  if (newChatMode === "direct") {
    return (
      <NewChatPanel
        users={users}
        isLoading={isLoadingUsers}
        onClose={onCloseNewChat}
        onBack={onBackToNewChatPicker}
        onChatStarted={onChatStarted}
        onSelectChat={onSelectChatById}
        variant="panel"
      />
    );
  }

  if (newChatMode === "group") {
    return (
      <NewGroupPanel
        users={users}
        isLoading={isLoadingUsers}
        onClose={onCloseNewChat}
        onBack={onBackToNewChatPicker}
        onChatStarted={onChatStarted}
        onSelectChat={onSelectChatById}
        variant="panel"
      />
    );
  }

  if (selectedChat && selectedChatId) {
    return (
      <ChatConversation chatId={selectedChatId} chat={selectedChat} onBack={onBackToList} />
    );
  }

  return <ChatEmptyState />;
}

const CHAT_BACKGROUND_STYLE = {
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
  backgroundSize: "24px 24px",
};

interface ChatMainPanelContainerProps extends ChatMainPanelProps {
  className?: string;
}

export function ChatMainPanelContainer({
  className = "",
  newChatMode,
  selectedChat,
  ...panelProps
}: ChatMainPanelContainerProps) {
  const usePatternBackground = !newChatMode && !selectedChat;

  return (
    <main
      className={`min-h-0 min-w-0 flex-1 flex-col ${className}`}
      style={usePatternBackground ? CHAT_BACKGROUND_STYLE : undefined}
    >
      <ChatMainPanel newChatMode={newChatMode} selectedChat={selectedChat} {...panelProps} />
    </main>
  );
}

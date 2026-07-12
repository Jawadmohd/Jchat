import type { User } from "../../types/api";
import ChatConversation from "./ChatConversation";
import ChatEmptyState from "./ChatEmptyState";
import NewChatPanel from "./NewChatPanel";

interface ChatMainPanelProps {
  showNewChat: boolean;
  selectedChatId: string | null;
  selectedUser: User | null;
  users: User[];
  isLoadingUsers: boolean;
  onCloseNewChat: () => void;
  onChatStarted: () => void;
  onSelectChatById: (chatId: string) => void;
  onBackToList: () => void;
}

export default function ChatMainPanel({
  showNewChat,
  selectedChatId,
  selectedUser,
  users,
  isLoadingUsers,
  onCloseNewChat,
  onChatStarted,
  onSelectChatById,
  onBackToList,
}: ChatMainPanelProps) {
  if (showNewChat) {
    return (
      <NewChatPanel
        users={users}
        isLoading={isLoadingUsers}
        onClose={onCloseNewChat}
        onChatStarted={onChatStarted}
        onSelectChat={onSelectChatById}
        variant="panel"
      />
    );
  }

  if (selectedUser && selectedChatId) {
    return (
      <ChatConversation chatId={selectedChatId} user={selectedUser} onBack={onBackToList} />
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
  showNewChat,
  selectedChatId,
  selectedUser,
  ...panelProps
}: ChatMainPanelContainerProps) {
  const usePatternBackground = !showNewChat && !selectedUser;

  return (
    <main
      className={`min-h-0 min-w-0 flex-1 flex-col ${className}`}
      style={usePatternBackground ? CHAT_BACKGROUND_STYLE : undefined}
    >
      <ChatMainPanel
        showNewChat={showNewChat}
        selectedChatId={selectedChatId}
        selectedUser={selectedUser}
        {...panelProps}
      />
    </main>
  );
}

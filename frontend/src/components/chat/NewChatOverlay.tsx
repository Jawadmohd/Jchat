import NewChatPanel from "./NewChatPanel";
import type { User } from "../../types/api";

interface NewChatOverlayProps {
  users: User[];
  isLoading: boolean;
  onClose: () => void;
  onChatStarted: () => void;
  onSelectChat: (chatId: string) => void;
}

export default function NewChatOverlay({
  users,
  isLoading,
  onClose,
  onChatStarted,
  onSelectChat,
}: NewChatOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary lg:hidden">
      <NewChatPanel
        users={users}
        isLoading={isLoading}
        onClose={onClose}
        onChatStarted={onChatStarted}
        onSelectChat={onSelectChat}
        variant="overlay"
      />
    </div>
  );
}

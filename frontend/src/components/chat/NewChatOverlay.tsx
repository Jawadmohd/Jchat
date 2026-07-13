import type { NewChatMode } from "../../types/api";
import NewChatPanel from "./NewChatPanel";
import NewChatPicker from "./NewChatPicker";
import NewGroupPanel from "./NewGroupPanel";

interface NewChatOverlayProps {
  mode: NewChatMode;
  onClose: () => void;
  onSelectMode: (mode: NewChatMode) => void;
  onBackToPicker: () => void;
  onChatStarted: () => void;
  onSelectChat: (chatId: string) => void;
}

export default function NewChatOverlay({
  mode,
  onClose,
  onSelectMode,
  onBackToPicker,
  onChatStarted,
  onSelectChat,
}: NewChatOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary lg:hidden">
      {mode === "picker" && (
        <NewChatPicker onSelect={onSelectMode} onClose={onClose} variant="overlay" />
      )}

      {mode === "direct" && (
        <NewChatPanel
          onClose={onClose}
          onBack={onBackToPicker}
          onChatStarted={onChatStarted}
          onSelectChat={onSelectChat}
          variant="overlay"
        />
      )}

      {mode === "group" && (
        <NewGroupPanel
          onClose={onClose}
          onBack={onBackToPicker}
          onChatStarted={onChatStarted}
          onSelectChat={onSelectChat}
          variant="overlay"
        />
      )}
    </div>
  );
}

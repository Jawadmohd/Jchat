import { HiArrowUturnLeft, HiMapPin } from "react-icons/hi2";

interface MessageBubbleMenuProps {
  isOwnMessage: boolean;
  isTextMessage: boolean;
  isPinned: boolean;
  isDeleting: boolean;
  onReply: () => void;
  onPinToggle: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

export default function MessageBubbleMenu({
  isOwnMessage,
  isTextMessage,
  isPinned,
  isDeleting,
  onReply,
  onPinToggle,
  onStartEdit,
  onDelete,
}: MessageBubbleMenuProps) {
  return (
    <div
      role="menu"
      className={`absolute top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-secondary/10 bg-primary py-1 shadow-lg ${
        isOwnMessage ? "right-0" : "left-0"
      }`}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onReply}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
      >
        <HiArrowUturnLeft className="h-4 w-4" />
        Reply
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onPinToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
      >
        <HiMapPin className="h-4 w-4" />
        {isPinned ? "Unpin" : "Pin"}
      </button>
      {isOwnMessage && isTextMessage && (
        <button
          type="button"
          role="menuitem"
          onClick={onStartEdit}
          className="flex w-full px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
        >
          Edit
        </button>
      )}
      {isOwnMessage && (
        <button
          type="button"
          role="menuitem"
          onClick={onDelete}
          disabled={isDeleting}
          className="flex w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-tertiary disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}

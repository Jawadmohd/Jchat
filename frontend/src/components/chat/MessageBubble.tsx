import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HiEllipsisVertical, HiMapPin } from "react-icons/hi2";
import type { Chat, Message } from "../../types/api";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { useAuth } from "../../hooks/useAuth";
import MessageQuote from "./MessageQuote";
import MessageReactions from "./MessageReactions";
import ReadReceiptsModal from "./ReadReceiptsModal";
import MessageAttachment from "./message/MessageAttachment";
import MessageBubbleEditForm from "./message/MessageBubbleEditForm";
import MessageBubbleMenu from "./message/MessageBubbleMenu";
import MessageReadStatus from "./message/MessageReadStatus";

interface MessageBubbleProps {
  message: Message;
  chat: Chat;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onReply: (message: Message) => void;
  onPin: (messageId: string) => Promise<void>;
  onUnpin: (messageId: string) => Promise<void>;
  onToggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

export default function MessageBubble({
  message,
  chat,
  onEdit,
  onDelete,
  onReply,
  onPin,
  onUnpin,
  onToggleReaction,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.sender.id === user?.id;
  const isGroup = chat.type === "group";
  const isTextMessage = message.messageType === "text";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReadReceipts, setShowReadReceipts] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [isEditing, message.content]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing, editContent.length]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();

    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);

    try {
      await onEdit(message.id, trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMenuOpen(false);

    try {
      await onDelete(message.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = () => {
    onReply(message);
    setMenuOpen(false);
  };

  const handlePinToggle = async () => {
    setMenuOpen(false);

    try {
      if (message.isPinned) {
        await onUnpin(message.id);
      } else {
        await onPin(message.id);
      }
    } catch {
      // Parent handles toast.
    }
  };

  const handleEditKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSaveEdit();
    }

    if (event.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative flex max-w-[min(75%,28rem)] flex-col ${
          isOwnMessage ? "items-end" : "items-start"
        } gap-0.5`}
      >
        {isGroup && !isOwnMessage && (
          <p className="px-1 text-[11px] font-medium text-muted">
            {getUserDisplayName(message.sender)}
          </p>
        )}

        <div className="relative flex items-start gap-1">
          {!isEditing && (
            <div ref={menuRef} className="relative shrink-0 self-center">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                disabled={isDeleting}
                className={`rounded-full p-1.5 text-muted opacity-100 transition hover:bg-tertiary hover:text-secondary disabled:opacity-50 lg:opacity-0 lg:group-hover:opacity-100 ${
                  isOwnMessage ? "" : "order-2"
                }`}
                aria-label="Message options"
                aria-expanded={menuOpen}
              >
                <HiEllipsisVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <MessageBubbleMenu
                  isOwnMessage={isOwnMessage}
                  isTextMessage={isTextMessage}
                  isPinned={message.isPinned}
                  isDeleting={isDeleting}
                  onReply={handleReply}
                  onPinToggle={() => void handlePinToggle()}
                  onStartEdit={handleStartEdit}
                  onDelete={() => void handleDelete()}
                />
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-3.5 py-2 shadow-sm ${
              isOwnMessage
                ? "rounded-br-md bg-secondary text-primary"
                : "rounded-bl-md border border-secondary/10 bg-tertiary text-secondary"
            } ${message.isPinned ? "ring-1 ring-secondary/20" : ""}`}
          >
            {message.isPinned && (
              <div className="mb-1 flex items-center gap-1 text-[10px] opacity-80">
                <HiMapPin className="h-3 w-3" />
                <span>Pinned</span>
              </div>
            )}

            {isEditing ? (
              <MessageBubbleEditForm
                inputRef={inputRef}
                editContent={editContent}
                isSaving={isSaving}
                isOwnMessage={isOwnMessage}
                onChange={setEditContent}
                onKeyDown={handleEditKeyDown}
                onCancel={handleCancelEdit}
                onSave={() => void handleSaveEdit()}
              />
            ) : (
              <div className="space-y-2">
                {message.replyTo && (
                  <MessageQuote
                    reply={message.replyTo}
                    currentUserId={user?.id}
                    variant="bubble"
                  />
                )}
                <MessageAttachment message={message} isOwnMessage={isOwnMessage} />
                {message.content && (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {!isEditing && (
              <MessageReadStatus
                message={message}
                chat={chat}
                isOwnMessage={isOwnMessage}
                onShowReadReceipts={() => setShowReadReceipts(true)}
              />
            )}
          </div>
        </div>

        {!isEditing && (
          <MessageReactions
            message={message}
            currentUserId={user?.id}
            onToggleReaction={onToggleReaction}
          />
        )}

        {showReadReceipts && (
          <ReadReceiptsModal
            message={message}
            chat={chat}
            onClose={() => setShowReadReceipts(false)}
          />
        )}
      </div>
    </div>
  );
}

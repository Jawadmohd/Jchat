import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HiArrowUturnLeft, HiCheck, HiDocument, HiEllipsisVertical, HiMapPin, HiXMark } from "react-icons/hi2";
import type { Chat, Message } from "../../types/api";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { formatChatTime } from "../../utils/formatChatTime";
import { useAuth } from "../../hooks/useAuth";
import MessageQuote from "./MessageQuote";

interface MessageBubbleProps {
  message: Message;
  chat: Chat;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
  onReply: (message: Message) => void;
  onPin: (messageId: string) => Promise<void>;
  onUnpin: (messageId: string) => Promise<void>;
}

export default function MessageBubble({
  message,
  chat,
  onEdit,
  onDelete,
  onReply,
  onPin,
  onUnpin,
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
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const otherParticipantId = chat.otherParticipant?.id;
  const isReadByOther =
    !isGroup &&
    isOwnMessage &&
    otherParticipantId &&
    message.readBy.includes(otherParticipantId);

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

  const renderAttachment = () => {
    if (message.messageType === "image" && message.attachmentUrl) {
      return (
        <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={message.attachmentUrl}
            alt={message.attachmentName ?? "Shared image"}
            className="max-h-64 max-w-full rounded-xl object-cover"
          />
        </a>
      );
    }

    if (message.messageType === "file" && message.attachmentUrl) {
      return (
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            isOwnMessage
              ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-secondary/10 bg-primary text-secondary hover:bg-primary/80"
          }`}
        >
          <HiDocument className="h-5 w-5 shrink-0" />
          <span className="truncate">{message.attachmentName ?? "Download file"}</span>
        </a>
      );
    }

    return null;
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
                <div
                  role="menu"
                  className={`absolute bottom-full z-10 mb-1 min-w-[120px] overflow-hidden rounded-xl border border-secondary/10 bg-primary py-1 shadow-lg ${
                    isOwnMessage ? "right-0" : "left-0"
                  }`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleReply}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
                  >
                    <HiArrowUturnLeft className="h-4 w-4" />
                    Reply
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handlePinToggle()}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
                  >
                    <HiMapPin className="h-4 w-4" />
                    {message.isPinned ? "Unpin" : "Pin"}
                  </button>
                  {isOwnMessage && isTextMessage && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleStartEdit}
                      className="flex w-full px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
                    >
                      Edit
                    </button>
                  )}
                  {isOwnMessage && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleDelete()}
                      className="flex w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-tertiary"
                    >
                      Delete
                    </button>
                  )}
                </div>
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
              <div className="space-y-2">
                <textarea
                  ref={inputRef}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={2}
                  disabled={isSaving}
                  className={`w-full resize-none bg-transparent text-sm leading-relaxed outline-none ${
                    isOwnMessage
                      ? "text-primary placeholder:text-primary/60"
                      : "text-secondary placeholder:text-muted"
                  }`}
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="rounded-full p-1.5 transition hover:bg-primary/10 disabled:opacity-50"
                    aria-label="Cancel edit"
                  >
                    <HiXMark className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveEdit()}
                    disabled={isSaving || !editContent.trim()}
                    className="rounded-full p-1.5 transition hover:bg-primary/10 disabled:opacity-50"
                    aria-label="Save edit"
                  >
                    <HiCheck className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {message.replyTo && (
                  <MessageQuote
                    reply={message.replyTo}
                    currentUserId={user?.id}
                    variant="bubble"
                  />
                )}
                {renderAttachment()}
                {message.content && (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {!isEditing && (
              <div
                className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
                  isOwnMessage ? "text-primary/80" : "text-muted"
                }`}
              >
                <span>
                  {formatChatTime(message.createdAt)}
                  {message.isEdited && <span className="ml-1 italic">edited</span>}
                </span>
                {isOwnMessage && !isGroup && (
                  <span
                    className={`inline-flex items-center ${
                      isReadByOther ? "text-sky-400" : "text-primary"
                    }`}
                    title={isReadByOther ? "Read" : "Sent"}
                  >
                    <HiCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                    {isReadByOther && <HiCheck className="-ml-2 h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

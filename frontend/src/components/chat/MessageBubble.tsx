import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { HiCheck, HiEllipsisVertical, HiXMark } from "react-icons/hi2";
import type { Message } from "../../types/api";
import { formatChatTime } from "../../utils/formatChatTime";
import { useAuth } from "../../hooks/useAuth";

interface MessageBubbleProps {
  message: Message;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export default function MessageBubble({ message, onEdit, onDelete }: MessageBubbleProps) {
  const { user } = useAuth();
  const isOwnMessage = message.sender.id === user?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
      <div className={`relative flex max-w-[min(75%,28rem)] items-start gap-1`}>
        {isOwnMessage && !isEditing && (
          <div ref={menuRef} className="relative shrink-0 self-center">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={isDeleting}
              className="rounded-full p-1.5 text-muted opacity-100 transition hover:bg-tertiary hover:text-secondary disabled:opacity-50 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="Message options"
              aria-expanded={menuOpen}
            >
              <HiEllipsisVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute bottom-full right-0 z-10 mb-1 min-w-[120px] overflow-hidden rounded-xl border border-secondary/10 bg-primary py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleStartEdit}
                  className="flex w-full px-3 py-2 text-left text-sm text-secondary transition hover:bg-tertiary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleDelete()}
                  className="flex w-full px-3 py-2 text-left text-sm text-red-600 transition hover:bg-tertiary"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2 shadow-sm ${
            isOwnMessage
              ? "rounded-br-md bg-secondary text-primary"
              : "rounded-bl-md border border-secondary/10 bg-tertiary text-secondary"
          }`}
        >
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
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          )}

          {!isEditing && (
            <p
              className={`mt-1 text-right text-[10px] ${
                isOwnMessage ? "text-primary/70" : "text-muted"
              }`}
            >
              {formatChatTime(message.createdAt)}
              {message.isEdited && <span className="ml-1 italic">edited</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

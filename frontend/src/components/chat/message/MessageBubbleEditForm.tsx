import { type KeyboardEvent, type RefObject } from "react";
import { HiCheck, HiXMark } from "react-icons/hi2";

interface MessageBubbleEditFormProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  editContent: string;
  isSaving: boolean;
  isOwnMessage: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function MessageBubbleEditForm({
  inputRef,
  editContent,
  isSaving,
  isOwnMessage,
  onChange,
  onKeyDown,
  onCancel,
  onSave,
}: MessageBubbleEditFormProps) {
  return (
    <div className="space-y-2">
      <textarea
        ref={inputRef}
        value={editContent}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
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
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full p-1.5 transition hover:bg-primary/10 disabled:opacity-50"
          aria-label="Cancel edit"
        >
          <HiXMark className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !editContent.trim()}
          className="rounded-full p-1.5 transition hover:bg-primary/10 disabled:opacity-50"
          aria-label="Save edit"
        >
          <HiCheck className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { HiUserGroup, HiUserPlus } from "react-icons/hi2";
import type { NewChatMode } from "../../types/api";

interface NewChatPickerProps {
  onSelect: (mode: Exclude<NewChatMode, "picker">) => void;
  onClose: () => void;
  variant?: "panel" | "overlay";
}

export default function NewChatPicker({
  onSelect,
  onClose,
  variant = "panel",
}: NewChatPickerProps) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={`flex h-full flex-col bg-primary text-secondary ${
        isOverlay ? "min-h-0" : ""
      }`}
    >
      <header
        className={`flex items-center justify-between border-b border-secondary/10 bg-tertiary ${
          isOverlay ? "px-4 py-4" : "px-6 py-5"
        }`}
      >
        <div>
          <h2 className="text-lg font-semibold">Start a conversation</h2>
          <p className="mt-0.5 text-sm text-muted">Choose how you want to chat</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-muted transition hover:bg-primary"
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <div className={`grid gap-3 ${isOverlay ? "p-4" : "p-6"} sm:grid-cols-2`}>
        <button
          type="button"
          onClick={() => onSelect("direct")}
          className="flex flex-col items-start gap-3 rounded-2xl border border-secondary/10 bg-tertiary p-5 text-left transition hover:border-secondary/20 hover:bg-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <HiUserPlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-secondary">New chat</span>
            <span className="mt-1 block text-sm text-muted">
              Message one person directly
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("group")}
          className="flex flex-col items-start gap-3 rounded-2xl border border-secondary/10 bg-tertiary p-5 text-left transition hover:border-secondary/20 hover:bg-primary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <HiUserGroup className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-secondary">New group</span>
            <span className="mt-1 block text-sm text-muted">
              Chat with multiple people
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

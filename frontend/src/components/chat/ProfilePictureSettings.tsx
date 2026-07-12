import { useRef, useState, type ChangeEvent } from "react";
import { HiCamera, HiTrash } from "react-icons/hi2";
import toast from "react-hot-toast";
import {
  useRemoveAvatarMutation,
  useUploadAvatarMutation,
} from "../../features/auth/authApi";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import SettingsSection from "./SettingsSection";
import UserAvatar from "./UserAvatar";

export default function ProfilePictureSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: isRemoving }] = useRemoveAvatarMutation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  const isBusy = isUploading || isRemoving;
  const displayAvatarUrl = previewUrl ?? user.avatarUrl;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, WebP, or GIF image");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await uploadAvatar(formData).unwrap();
      toast.success("Profile picture updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload profile picture"));
      setPreviewUrl(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      event.target.value = "";
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm("Remove your profile picture?");

    if (!confirmed) {
      return;
    }

    try {
      await removeAvatar().unwrap();
      toast.success("Profile picture removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove profile picture"));
    }
  };

  return (
    <SettingsSection
      title="Profile picture"
      description="Upload a photo so others can recognize you in chats."
      className="flex flex-col"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center lg:py-6">
        <div className="relative">
          <UserAvatar name={getUserDisplayName(user)} avatarUrl={displayAvatarUrl} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-secondary/10 bg-primary text-secondary shadow-sm transition hover:bg-tertiary disabled:opacity-60"
            aria-label="Change profile picture"
          >
            <HiCamera className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-secondary">{getUserDisplayName(user)}</p>
          <p className="mt-0.5 text-xs text-muted">@{user.username}</p>
          <p className="mt-3 text-xs text-muted">JPG, PNG, WebP, or GIF. Max 5MB.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-primary transition hover:opacity-90 disabled:opacity-60"
          >
            {isUploading ? "Uploading..." : "Upload photo"}
          </button>

          {user.avatarUrl && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-full border border-secondary/10 bg-primary px-4 py-2 text-sm text-secondary transition hover:bg-primary/80 disabled:opacity-60"
            >
              <HiTrash className="h-4 w-4" />
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(event) => void handleFileChange(event)}
        className="hidden"
      />
    </SettingsSection>
  );
}

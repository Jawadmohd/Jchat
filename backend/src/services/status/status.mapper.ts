import type { IStatusDocument } from "../../models";
import type { PopulatedUser } from "../../types/populated.types";

export const STATUS_AUTHOR_FIELDS = "username name emailId avatarUrl";

export const toPublicStatus = (
  status: IStatusDocument,
  currentUserId?: string
) => {
  const author = status.author as unknown as PopulatedUser;
  const viewers = status.viewers ?? [];
  const viewed =
    currentUserId != null
      ? viewers.some((viewer) => viewer.userId.toString() === currentUserId)
      : false;

  return {
    id: status._id.toString(),
    type: status.type,
    text: status.text ?? "",
    mediaUrl: status.mediaUrl ?? null,
    backgroundColor: status.backgroundColor ?? "#111827",
    expiresAt: status.expiresAt.toISOString(),
    createdAt: status.createdAt.toISOString(),
    viewed,
    viewCount: viewers.length,
    author: {
      id: author._id.toString(),
      username: author.username,
      name: author.name?.trim() || author.username,
      emailId: author.emailId,
      avatarUrl: author.avatarUrl ?? null,
    },
  };
};

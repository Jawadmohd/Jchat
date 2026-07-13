import type { IUserDocument } from "../../models";

export const toPublicUser = (user: IUserDocument) => ({
  id: user._id.toString(),
  emailId: user.emailId,
  username: user.username,
  name: user.name?.trim() || user.username,
  avatarUrl: user.avatarUrl ?? null,
  identityPublicKey: user.identityPublicKey ?? null,
  lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

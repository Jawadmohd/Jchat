export const SENDER_POPULATE_FIELDS = "username name emailId avatarUrl identityPublicKey";

export const REPLY_POPULATE = {
  path: "replyTo",
  select: "content messageType attachmentName sender isEncrypted ciphertext iv",
  populate: { path: "sender", select: SENDER_POPULATE_FIELDS },
} as const;

export const ALLOWED_REACTIONS = new Set(["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"]);

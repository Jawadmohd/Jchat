import { Router } from "express";
import {
  addMembers,
  createDirectChat,
  createGroup,
  getChat,
  leaveGroupChat,
  listChats,
  markChatAsRead,
  pinUserChat,
  removeMember,
  renameGroup,
  unpinUserChat,
  upsertE2EEKeys,
} from "../../controllers/chat/chat.controller";
import {
  editMessage,
  listMessages,
  listPinnedMessages,
  pinChatMessage,
  removeMessage,
  sendAttachment,
  sendMessage,
  toggleReaction,
  unpinChatMessage,
  getReadReceipts,
} from "../../controllers/message/message.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { messageAttachmentUpload } from "../../middlewares/upload.middleware";
import {
  addGroupMembersSchema,
  createDirectChatSchema,
  createGroupChatSchema,
  updateGroupNameSchema,
} from "../../validators/chat.validator";
import {
  createMessageSchema,
  listMessagesSchema,
  toggleReactionSchema,
  updateMessageSchema,
  upsertWrappedKeysSchema,
} from "../../validators/message.validator";

const router = Router();

router.get("/", authenticate, listChats);
router.post("/direct", authenticate, validate(createDirectChatSchema), createDirectChat);
router.post("/group", authenticate, validate(createGroupChatSchema), createGroup);
router.get("/:chatId/messages", authenticate, validate(listMessagesSchema, "query"), listMessages);
router.get("/:chatId/messages/pinned", authenticate, listPinnedMessages);
router.post("/:chatId/messages", authenticate, validate(createMessageSchema), sendMessage);
router.post(
  "/:chatId/messages/attachment",
  authenticate,
  messageAttachmentUpload.single("attachment"),
  sendAttachment
);
router.post("/:chatId/read", authenticate, markChatAsRead);
router.post("/:chatId/pin", authenticate, pinUserChat);
router.delete("/:chatId/pin", authenticate, unpinUserChat);
router.patch("/:chatId", authenticate, validate(updateGroupNameSchema), renameGroup);
router.post("/:chatId/members", authenticate, validate(addGroupMembersSchema), addMembers);
router.delete("/:chatId/members/:memberId", authenticate, removeMember);
router.post("/:chatId/leave", authenticate, leaveGroupChat);
router.put("/:chatId/e2ee-keys", authenticate, validate(upsertWrappedKeysSchema), upsertE2EEKeys);
router.post("/:chatId/messages/:messageId/pin", authenticate, pinChatMessage);
router.delete("/:chatId/messages/:messageId/pin", authenticate, unpinChatMessage);
router.post(
  "/:chatId/messages/:messageId/reactions",
  authenticate,
  validate(toggleReactionSchema),
  toggleReaction
);
router.get("/:chatId/messages/:messageId/read-receipts", authenticate, getReadReceipts);
router.patch(
  "/:chatId/messages/:messageId",
  authenticate,
  validate(updateMessageSchema),
  editMessage
);
router.delete("/:chatId/messages/:messageId", authenticate, removeMessage);
router.get("/:id", authenticate, getChat);

export default router;

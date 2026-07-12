import { Router } from "express";
import {
  createDirectChat,
  createGroup,
  getChat,
  listChats,
  markChatAsRead,
  pinUserChat,
  unpinUserChat,
} from "../../controllers/chat/chat.controller";
import {
  editMessage,
  listMessages,
  listPinnedMessages,
  pinChatMessage,
  removeMessage,
  sendAttachment,
  sendMessage,
  unpinChatMessage,
} from "../../controllers/message/message.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { messageAttachmentUpload } from "../../middlewares/upload.middleware";
import {
  createDirectChatSchema,
  createGroupChatSchema,
} from "../../validators/chat.validator";
import {
  createMessageSchema,
  listMessagesSchema,
  updateMessageSchema,
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
router.post("/:chatId/messages/:messageId/pin", authenticate, pinChatMessage);
router.delete("/:chatId/messages/:messageId/pin", authenticate, unpinChatMessage);
router.patch(
  "/:chatId/messages/:messageId",
  authenticate,
  validate(updateMessageSchema),
  editMessage
);
router.delete("/:chatId/messages/:messageId", authenticate, removeMessage);
router.get("/:id", authenticate, getChat);

export default router;

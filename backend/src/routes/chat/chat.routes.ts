import { Router } from "express";
import {
  createDirectChat,
  getChat,
  listChats,
} from "../../controllers/chat/chat.controller";
import {
  editMessage,
  listMessages,
  removeMessage,
  sendMessage,
} from "../../controllers/message/message.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createDirectChatSchema } from "../../validators/chat.validator";
import {
  createMessageSchema,
  listMessagesSchema,
  updateMessageSchema,
} from "../../validators/message.validator";

const router = Router();

router.get("/", authenticate, listChats);
router.post("/direct", authenticate, validate(createDirectChatSchema), createDirectChat);
router.get("/:chatId/messages", authenticate, validate(listMessagesSchema, "query"), listMessages);
router.post("/:chatId/messages", authenticate, validate(createMessageSchema), sendMessage);
router.patch(
  "/:chatId/messages/:messageId",
  authenticate,
  validate(updateMessageSchema),
  editMessage
);
router.delete("/:chatId/messages/:messageId", authenticate, removeMessage);
router.get("/:id", authenticate, getChat);

export default router;

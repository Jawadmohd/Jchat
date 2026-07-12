import { Router } from "express";
import healthRoutes from "./health.routes";
import { userRoutes } from "./user";
import { messageRoutes } from "./message";
import { chatRoutes } from "./chat";

const router = Router();

router.use(healthRoutes);
router.use("/users", userRoutes);
router.use("/messages", messageRoutes);
router.use("/chats", chatRoutes);

export default router;

import { Router } from "express";
import {
  createStatus,
  createStatusMedia,
  listStatusFeed,
  listStatusViewers,
  removeStatus,
  viewStatus,
} from "../../controllers/status/status.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { statusUpload } from "../../middlewares/upload.middleware";
import { createStatusSchema } from "../../validators/status.validator";

const router = Router();

router.get("/", authenticate, listStatusFeed);
router.post("/", authenticate, validate(createStatusSchema), createStatus);
router.post(
  "/media",
  authenticate,
  statusUpload.single("media"),
  createStatusMedia
);
router.post("/:id/view", authenticate, viewStatus);
router.get("/:id/viewers", authenticate, listStatusViewers);
router.delete("/:id", authenticate, removeStatus);

export default router;

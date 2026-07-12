import { Router } from "express";
import {
  deleteUserById,
  getMe,
  getUser,
  getUsers,
  login,
  logout,
  register,
  removeAvatar,
  updateMyProfile,
  updateUserById,
  uploadAvatar,
} from "../../controllers/user/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { avatarUpload } from "../../middlewares/upload.middleware";
import {
  loginUserSchema,
  registerUserSchema,
  updateUserSchema,
} from "../../validators/user.validator";

const router = Router();

router.post("/register", validate(registerUserSchema), register);
router.post("/login", validate(loginUserSchema), login);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch("/me/profile", authenticate, validate(updateUserSchema), updateMyProfile);
router.post(
  "/me/avatar",
  authenticate,
  avatarUpload.single("avatar"),
  uploadAvatar
);
router.delete("/me/avatar", authenticate, removeAvatar);
router.get("/", authenticate, getUsers);
router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, validate(updateUserSchema), updateUserById);
router.delete("/:id", authenticate, deleteUserById);

export default router;

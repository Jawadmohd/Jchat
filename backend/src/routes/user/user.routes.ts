import { Router } from "express";
import {
  checkUsernameAvailability,
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
  uploadIdentityKey,
} from "../../controllers/user/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { optionalAuthenticate } from "../../middlewares/optionalAuth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { avatarUpload } from "../../middlewares/upload.middleware";
import {
  checkUsernameAvailabilitySchema,
  loginUserSchema,
  registerUserSchema,
  searchUsersSchema,
  updateUserSchema,
} from "../../validators/user.validator";
import { identityKeySchema } from "../../validators/e2ee.validator";

const router = Router();

router.post("/register", validate(registerUserSchema), register);
router.post("/login", validate(loginUserSchema), login);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch("/me/profile", authenticate, validate(updateUserSchema), updateMyProfile);
router.put("/me/identity-key", authenticate, validate(identityKeySchema), uploadIdentityKey);
router.post(
  "/me/avatar",
  authenticate,
  avatarUpload.single("avatar"),
  uploadAvatar
);
router.delete("/me/avatar", authenticate, removeAvatar);
router.get(
  "/username/availability",
  optionalAuthenticate,
  validate(checkUsernameAvailabilitySchema, "query"),
  checkUsernameAvailability
);
router.get("/", authenticate, validate(searchUsersSchema, "query"), getUsers);
router.get("/:id", authenticate, getUser);
router.put("/:id", authenticate, validate(updateUserSchema), updateUserById);
router.delete("/:id", authenticate, deleteUserById);

export default router;

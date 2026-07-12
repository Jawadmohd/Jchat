import type { Request, Response } from "express";
import {
  clearUserAvatar,
  deleteUser,
  getAllUsers,
  getUserAvatarMeta,
  getUserById,
  loginUser,
  registerUser,
  setUserAvatar,
  updateUser,
} from "../../services/user/user.service";
import {
  asyncHandler,
  ApiError,
  clearAuthCookie,
  setAuthCookie,
} from "../../utils";
import {
  deleteAvatarFromCloudinary,
  uploadAvatarToCloudinary,
} from "../../utils/cloudinary.util";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await registerUser(req.body);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await loginUser(req.body);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await getAllUsers();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(String(req.params.id));

  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);

  if (req.user!.id !== userId) {
    throw new ApiError(403, "You can only update your own account");
  }

  const user = await updateUser(userId, req.body);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUser(req.user!.id, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar image is required");
  }

  const userId = req.user!.id;
  const existingAvatar = await getUserAvatarMeta(userId);

  if (existingAvatar.avatarPublicId) {
    await deleteAvatarFromCloudinary(existingAvatar.avatarPublicId);
  }

  const { url, publicId } = await uploadAvatarToCloudinary(req.file, userId);
  const user = await setUserAvatar(userId, url, publicId);

  res.status(200).json({
    success: true,
    message: "Profile picture updated",
    data: user,
  });
});

export const removeAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const existingAvatar = await getUserAvatarMeta(userId);

  if (existingAvatar.avatarPublicId) {
    await deleteAvatarFromCloudinary(existingAvatar.avatarPublicId);
  }

  const user = await clearUserAvatar(userId);

  res.status(200).json({
    success: true,
    message: "Profile picture removed",
    data: user,
  });
});

export const deleteUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = String(req.params.id);

  if (req.user!.id !== userId) {
    throw new ApiError(403, "You can only delete your own account");
  }

  const existingAvatar = await getUserAvatarMeta(userId);

  if (existingAvatar.avatarPublicId) {
    await deleteAvatarFromCloudinary(existingAvatar.avatarPublicId);
  }

  await deleteUser(userId);
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

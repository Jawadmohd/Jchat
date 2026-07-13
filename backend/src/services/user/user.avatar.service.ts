import { User } from "../../models";
import { ApiError } from "../../utils";
import { toPublicUser } from "./user.mapper";

export const setUserAvatar = async (
  userId: string,
  avatarUrl: string,
  avatarPublicId: string
) => {
  const user = await User.findById(userId).select("+avatarPublicId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.avatarUrl = avatarUrl;
  user.avatarPublicId = avatarPublicId;
  await user.save();

  return toPublicUser(user);
};

export const clearUserAvatar = async (userId: string) => {
  const user = await User.findById(userId).select("+avatarPublicId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.avatarUrl = null;
  user.avatarPublicId = null;
  await user.save();

  return toPublicUser(user);
};

export const getUserAvatarMeta = async (userId: string) => {
  const user = await User.findById(userId).select("+avatarPublicId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    avatarUrl: user.avatarUrl ?? null,
    avatarPublicId: user.avatarPublicId ?? null,
  };
};

import { CACHE_TTL, cacheGetOrSet, cacheKeys } from "../../cache";
import { EventTypes, publishEvent } from "../../events";
import { User } from "../../models";
import { ApiError, comparePassword, hashPassword } from "../../utils";
import { toPublicUser } from "./user.mapper";

interface UpdateUserInput {
  emailId?: string;
  username?: string;
  name?: string;
  password?: string;
  currentPassword?: string;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface SearchUsersOptions {
  limit?: number;
}

export const searchUsers = async (
  currentUserId: string,
  query: string,
  options: SearchUsersOptions = {}
) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const limit = Math.min(options.limit ?? 20, 50);
  const pattern = new RegExp(escapeRegex(trimmedQuery), "i");

  return cacheGetOrSet(cacheKeys.searchUsers(currentUserId, trimmedQuery), CACHE_TTL.SEARCH, async () => {
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [{ username: pattern }, { name: pattern }, { emailId: pattern }],
    })
      .sort({ username: 1 })
      .limit(limit);

    return users.map(toPublicUser);
  });
};

export const isUsernameAvailable = async (username: string, excludeUserId?: string) => {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    return false;
  }

  const filter: Record<string, unknown> = { username: trimmedUsername };

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }

  const existingUser = await User.findOne(filter).select("_id");
  return !existingUser;
};

export const getUserById = async (userId: string) => {
  return cacheGetOrSet(cacheKeys.userProfile(userId), CACHE_TTL.USER_PROFILE, async () => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return toPublicUser(user);
  });
};

export const updateUser = async (userId: string, input: UpdateUserInput) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (input.emailId || input.username) {
    const conflict = await User.findOne({
      _id: { $ne: userId },
      $or: [
        ...(input.emailId ? [{ emailId: input.emailId }] : []),
        ...(input.username ? [{ username: input.username }] : []),
      ],
    });

    if (conflict) {
      if (conflict.emailId === input.emailId) {
        throw new ApiError(409, "Email already registered");
      }
      throw new ApiError(409, "Username already taken");
    }
  }

  if (input.password) {
    if (!input.currentPassword) {
      throw new ApiError(400, "Current password is required");
    }

    const isCurrentPasswordValid = await comparePassword(
      input.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password = await hashPassword(input.password);
  }

  if (input.emailId) user.emailId = input.emailId;
  if (input.username) user.username = input.username;
  if (input.name !== undefined) user.name = input.name.trim();

  await user.save();

  await publishEvent(EventTypes.USER_AUTH_INVALIDATED, { userId });

  return toPublicUser(user);
};

export const deleteUser = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await publishEvent(EventTypes.USER_AUTH_INVALIDATED, { userId });

  return toPublicUser(user);
};

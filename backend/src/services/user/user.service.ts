import { User, type IUserDocument } from "../../models";
import {
  ApiError,
  comparePassword,
  hashPassword,
  signToken,
} from "../../utils";

interface RegisterInput {
  emailId: string;
  username: string;
  name: string;
  password: string;
}

interface LoginInput {
  emailId: string;
  password: string;
}

interface UpdateUserInput {
  emailId?: string;
  username?: string;
  name?: string;
  password?: string;
  currentPassword?: string;
}

const toPublicUser = (user: IUserDocument) => ({
  id: user._id.toString(),
  emailId: user.emailId,
  username: user.username,
  name: user.name?.trim() || user.username,
  avatarUrl: user.avatarUrl ?? null,
  lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({
    $or: [{ emailId: input.emailId }, { username: input.username }],
  });

  if (existingUser) {
    if (existingUser.emailId === input.emailId) {
      throw new ApiError(409, "Email already registered");
    }
    throw new ApiError(409, "Username already taken");
  }

  const hashedPassword = await hashPassword(input.password);
  const user = await User.create({
    ...input,
    password: hashedPassword,
  });

  const token = signToken({ userId: user._id.toString() });

  return {
    user: toPublicUser(user),
    token,
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ emailId: input.emailId }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user._id.toString() });

  return {
    user: toPublicUser(user),
    token,
  };
};

export const getAllUsers = async () => {
  const users = await User.find().sort({ username: 1 });
  return users.map(toPublicUser);
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(user);
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

  return toPublicUser(user);
};

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

export const deleteUser = async (userId: string) => {
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toPublicUser(user);
};

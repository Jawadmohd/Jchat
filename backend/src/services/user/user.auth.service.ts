import { User } from "../../models";
import { ApiError, comparePassword, hashPassword, signToken } from "../../utils";
import { toPublicUser } from "./user.mapper";

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

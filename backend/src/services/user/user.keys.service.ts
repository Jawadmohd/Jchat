import { User } from "../../models";
import { ApiError } from "../../utils";
import { toPublicUser } from "./user.mapper";

export const setIdentityPublicKey = async (userId: string, identityPublicKey: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.identityPublicKey = identityPublicKey;
  await user.save();

  return toPublicUser(user);
};

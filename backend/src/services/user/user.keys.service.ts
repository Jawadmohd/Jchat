import { EventTypes, publishEvent } from "../../events";
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

  await publishEvent(EventTypes.USER_AUTH_INVALIDATED, { userId });

  return toPublicUser(user);
};

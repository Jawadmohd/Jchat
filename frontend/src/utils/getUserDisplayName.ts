import type { User } from "../types/api";

export const getUserDisplayName = (user: Pick<User, "name" | "username">): string =>
  user.name.trim() || user.username;

import type { User } from "./user";

export interface StatusItem {
  id: string;
  type: "text" | "image";
  text: string;
  mediaUrl: string | null;
  backgroundColor: string;
  expiresAt: string;
  createdAt: string;
  viewed: boolean;
  viewCount: number;
  author: Pick<User, "id" | "username" | "name" | "emailId" | "avatarUrl">;
}

export interface StatusContactGroup {
  user: Pick<User, "id" | "username" | "name" | "emailId" | "avatarUrl">;
  statuses: StatusItem[];
  hasUnviewed: boolean;
}

export interface StatusFeed {
  myStatuses: StatusItem[];
  contacts: StatusContactGroup[];
}

export interface StatusFeedResponse {
  success: boolean;
  data: StatusFeed;
}

export interface StatusResponse {
  success: boolean;
  message?: string;
  data: StatusItem;
}

export interface StatusViewerEntry {
  user: Pick<User, "id" | "username" | "name" | "emailId" | "avatarUrl">;
  viewedAt: string;
}

import { Types } from "mongoose";
import { Chat, Status, User } from "../../models";
import { EventTypes, publishEvent } from "../../events";
import { ApiError } from "../../utils";
import { STATUS_AUTHOR_FIELDS, toPublicStatus } from "./status.mapper";

const STATUS_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_STATUSES = 20;

const TEXT_COLORS = [
  "#111827",
  "#1e3a5f",
  "#14532d",
  "#7c2d12",
  "#4c1d95",
  "#831843",
  "#0f766e",
];

const getContactIds = async (userId: string) => {
  const chats = await Chat.find({ participants: userId }).select("participants").lean();
  const contactIds = new Set<string>();

  for (const chat of chats) {
    for (const participantId of chat.participants) {
      const id = participantId.toString();
      if (id !== userId) {
        contactIds.add(id);
      }
    }
  }

  return [...contactIds];
};

export const createTextStatus = async (
  userId: string,
  text: string,
  backgroundColor?: string
) => {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new ApiError(400, "Status text is required");
  }

  const activeCount = await Status.countDocuments({
    author: userId,
    expiresAt: { $gt: new Date() },
  });

  if (activeCount >= MAX_ACTIVE_STATUSES) {
    throw new ApiError(400, "You can post up to 20 active statuses");
  }

  const status = await Status.create({
    author: userId,
    type: "text",
    text: trimmed.slice(0, 700),
    backgroundColor:
      backgroundColor && TEXT_COLORS.includes(backgroundColor)
        ? backgroundColor
        : TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)],
    expiresAt: new Date(Date.now() + STATUS_TTL_MS),
  });

  await status.populate("author", STATUS_AUTHOR_FIELDS);
  const publicStatus = toPublicStatus(status, userId);

  await publishEvent(EventTypes.STATUS_CREATED, {
    status: publicStatus,
    authorId: userId,
  });

  return publicStatus;
};

export const createImageStatus = async (
  userId: string,
  mediaUrl: string,
  mediaPublicId: string,
  caption?: string
) => {
  const activeCount = await Status.countDocuments({
    author: userId,
    expiresAt: { $gt: new Date() },
  });

  if (activeCount >= MAX_ACTIVE_STATUSES) {
    throw new ApiError(400, "You can post up to 20 active statuses");
  }

  const status = await Status.create({
    author: userId,
    type: "image",
    text: caption?.trim().slice(0, 700) ?? "",
    mediaUrl,
    mediaPublicId,
    expiresAt: new Date(Date.now() + STATUS_TTL_MS),
  });

  await status.populate("author", STATUS_AUTHOR_FIELDS);
  const publicStatus = toPublicStatus(status, userId);

  await publishEvent(EventTypes.STATUS_CREATED, {
    status: publicStatus,
    authorId: userId,
  });

  return publicStatus;
};

export const getStatusFeed = async (userId: string) => {
  const contactIds = await getContactIds(userId);
  const authorIds = [userId, ...contactIds];
  const now = new Date();

  const statuses = await Status.find({
    author: { $in: authorIds },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: 1 })
    .populate("author", STATUS_AUTHOR_FIELDS);

  const myStatuses = statuses
    .filter((status) => {
      const author = status.author as unknown as { _id: Types.ObjectId };
      return author._id.toString() === userId;
    })
    .map((status) => toPublicStatus(status, userId));

  const contactMap = new Map<
    string,
    {
      user: ReturnType<typeof toPublicStatus>["author"];
      statuses: ReturnType<typeof toPublicStatus>[];
      hasUnviewed: boolean;
    }
  >();

  for (const status of statuses) {
    const author = status.author as unknown as {
      _id: Types.ObjectId;
      username: string;
      name?: string;
      emailId: string;
      avatarUrl?: string | null;
    };
    const authorId = author._id.toString();

    if (authorId === userId) {
      continue;
    }

    const publicStatus = toPublicStatus(status, userId);
    const existing = contactMap.get(authorId);

    if (!existing) {
      contactMap.set(authorId, {
        user: {
          id: authorId,
          username: author.username,
          name: author.name?.trim() || author.username,
          emailId: author.emailId,
          avatarUrl: author.avatarUrl ?? null,
        },
        statuses: [publicStatus],
        hasUnviewed: !publicStatus.viewed,
      });
    } else {
      existing.statuses.push(publicStatus);
      existing.hasUnviewed = existing.hasUnviewed || !publicStatus.viewed;
    }
  }

  const contacts = [...contactMap.values()].sort((a, b) => {
    if (a.hasUnviewed !== b.hasUnviewed) {
      return a.hasUnviewed ? -1 : 1;
    }

    const aLatest = a.statuses[a.statuses.length - 1]?.createdAt ?? "";
    const bLatest = b.statuses[b.statuses.length - 1]?.createdAt ?? "";
    return new Date(bLatest).getTime() - new Date(aLatest).getTime();
  });

  return {
    myStatuses,
    contacts,
  };
};

export const markStatusViewed = async (statusId: string, userId: string) => {
  const status = await Status.findOne({
    _id: statusId,
    expiresAt: { $gt: new Date() },
  }).populate("author", STATUS_AUTHOR_FIELDS);

  if (!status) {
    throw new ApiError(404, "Status not found");
  }

  const authorId = (status.author as unknown as { _id: Types.ObjectId })._id.toString();

  if (authorId === userId) {
    return toPublicStatus(status, userId);
  }

  const contactIds = await getContactIds(userId);

  if (!contactIds.includes(authorId)) {
    throw new ApiError(403, "You can only view statuses from your contacts");
  }

  const alreadyViewed = status.viewers.some(
    (viewer) => viewer.userId.toString() === userId
  );

  if (!alreadyViewed) {
    status.viewers.push({
      userId: new Types.ObjectId(userId),
      viewedAt: new Date(),
    });
    await status.save();
  }

  return toPublicStatus(status, userId);
};

export const deleteStatus = async (statusId: string, userId: string) => {
  const status = await Status.findOne({ _id: statusId, author: userId }).select(
    "+mediaPublicId"
  );

  if (!status) {
    throw new ApiError(404, "Status not found");
  }

  await status.deleteOne();

  await publishEvent(EventTypes.STATUS_DELETED, {
    statusId,
    authorId: userId,
  });

  return { statusId, authorId: userId };
};

export const getStatusViewers = async (statusId: string, userId: string) => {
  const status = await Status.findOne({
    _id: statusId,
    author: userId,
    expiresAt: { $gt: new Date() },
  });

  if (!status) {
    throw new ApiError(404, "Status not found");
  }

  const viewerIds = status.viewers.map((viewer) => viewer.userId);
  const users = await User.find({ _id: { $in: viewerIds } }).select(
    "username name emailId avatarUrl"
  );
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return status.viewers
    .map((viewer) => {
      const user = userMap.get(viewer.userId.toString());
      if (!user) {
        return null;
      }

      return {
        user: {
          id: user._id.toString(),
          username: user.username,
          name: user.name?.trim() || user.username,
          emailId: user.emailId,
          avatarUrl: user.avatarUrl ?? null,
        },
        viewedAt: viewer.viewedAt.toISOString(),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
};

export { getContactIds };

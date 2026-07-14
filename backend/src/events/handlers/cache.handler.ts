import {
  cacheDeletePattern,
  cacheKeys,
  invalidateAuthUser,
  invalidateChatCaches,
  invalidateInboxForParticipants,
} from "../../cache";
import { EventTypes, type DomainEvent } from "../event.types";
import type { EventBus } from "../eventBus.interface";

export const registerCacheHandlers = (bus: EventBus) => {
  bus.subscribe(EventTypes.MESSAGE_CREATED, async (event: DomainEvent<typeof EventTypes.MESSAGE_CREATED>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(EventTypes.MESSAGE_UPDATED, async (event: DomainEvent<typeof EventTypes.MESSAGE_UPDATED>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(EventTypes.MESSAGE_DELETED, async (event: DomainEvent<typeof EventTypes.MESSAGE_DELETED>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(EventTypes.MESSAGES_READ, async (event: DomainEvent<typeof EventTypes.MESSAGES_READ>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(EventTypes.MESSAGE_PINNED, async (event: DomainEvent<typeof EventTypes.MESSAGE_PINNED>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(
    EventTypes.MESSAGE_REACTION_TOGGLED,
    async (event: DomainEvent<typeof EventTypes.MESSAGE_REACTION_TOGGLED>) => {
      await cacheDeletePattern(cacheKeys.messagesPattern(event.payload.chatId));
    }
  );

  bus.subscribe(EventTypes.CHAT_UPDATED, async (event: DomainEvent<typeof EventTypes.CHAT_UPDATED>) => {
    await invalidateChatCaches(event.payload.chatId);
  });

  bus.subscribe(
    EventTypes.INBOX_INVALIDATED,
    async (event: DomainEvent<typeof EventTypes.INBOX_INVALIDATED>) => {
      await invalidateInboxForParticipants(event.payload.userIds, event.payload.chatId);
    }
  );

  bus.subscribe(
    EventTypes.USER_AUTH_INVALIDATED,
    async (event: DomainEvent<typeof EventTypes.USER_AUTH_INVALIDATED>) => {
      await invalidateAuthUser(event.payload.userId);
    }
  );
};

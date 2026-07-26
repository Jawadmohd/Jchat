import {
  emitChatUpdated,
  emitMessageDeleted,
  emitMessagePinned,
  emitMessageReaction,
  emitMessageUpdated,
  emitMessagesRead,
  emitNewMessage,
  emitStatusCreated,
  emitStatusDeleted,
} from "../../socket/emitter";
import { getContactIds } from "../../services/status/status.service";
import { EventTypes, type DomainEvent } from "../event.types";
import type { EventBus } from "../eventBus.interface";

export const registerSocketHandlers = (bus: EventBus) => {
  bus.subscribe(EventTypes.MESSAGE_CREATED, (event: DomainEvent<typeof EventTypes.MESSAGE_CREATED>) => {
    emitNewMessage(event.payload.chatId, event.payload.message);
  });

  bus.subscribe(EventTypes.MESSAGE_UPDATED, (event: DomainEvent<typeof EventTypes.MESSAGE_UPDATED>) => {
    emitMessageUpdated(event.payload.chatId, event.payload.message);
  });

  bus.subscribe(EventTypes.MESSAGE_DELETED, (event: DomainEvent<typeof EventTypes.MESSAGE_DELETED>) => {
    emitMessageDeleted(event.payload.chatId, {
      messageId: event.payload.messageId,
      chatId: event.payload.chatId,
    });
  });

  bus.subscribe(EventTypes.MESSAGES_READ, (event: DomainEvent<typeof EventTypes.MESSAGES_READ>) => {
    emitMessagesRead(event.payload.chatId, event.payload);
  });

  bus.subscribe(EventTypes.MESSAGE_PINNED, (event: DomainEvent<typeof EventTypes.MESSAGE_PINNED>) => {
    emitMessagePinned(event.payload.chatId, event.payload.message);
  });

  bus.subscribe(
    EventTypes.MESSAGE_REACTION_TOGGLED,
    (event: DomainEvent<typeof EventTypes.MESSAGE_REACTION_TOGGLED>) => {
      emitMessageReaction(event.payload.chatId, event.payload.message);
    }
  );

  bus.subscribe(EventTypes.CHAT_UPDATED, (event: DomainEvent<typeof EventTypes.CHAT_UPDATED>) => {
    emitChatUpdated(event.payload.chatId, event.payload.chat);
  });

  bus.subscribe(EventTypes.STATUS_CREATED, (event: DomainEvent<typeof EventTypes.STATUS_CREATED>) => {
    void (async () => {
      const contactIds = await getContactIds(event.payload.authorId);
      emitStatusCreated([...contactIds, event.payload.authorId], event.payload.status);
    })();
  });

  bus.subscribe(EventTypes.STATUS_DELETED, (event: DomainEvent<typeof EventTypes.STATUS_DELETED>) => {
    void (async () => {
      const contactIds = await getContactIds(event.payload.authorId);
      emitStatusDeleted([...contactIds, event.payload.authorId], event.payload);
    })();
  });
};

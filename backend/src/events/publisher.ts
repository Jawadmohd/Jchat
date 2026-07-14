import { randomUUID } from "crypto";
import type { DomainEvent, EventPayloadMap, EventType } from "./event.types";
import { getEventBus } from "./index";

export const publishEvent = async <T extends EventType>(
  type: T,
  payload: EventPayloadMap[T]
) => {
  const event: DomainEvent<T> = {
    id: randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    payload,
  };

  await getEventBus().publish(event);
};

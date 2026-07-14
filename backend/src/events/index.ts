import type { EventBus } from "./eventBus.interface";
import { InProcessEventBus } from "./inProcess.eventBus";
import { KafkaEventBus } from "./kafka.eventBus";
import { registerEventHandlers } from "./handlers";

let eventBus: EventBus | null = null;

export const initEventBus = async (): Promise<EventBus> => {
  if (eventBus) {
    return eventBus;
  }

  const kafkaBrokers = process.env.KAFKA_BROKERS?.split(",")
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (kafkaBrokers?.length) {
    eventBus = new KafkaEventBus(kafkaBrokers);
    console.log(`Using Kafka event bus (${kafkaBrokers.join(", ")})`);
  } else {
    eventBus = new InProcessEventBus();
    console.warn("KAFKA_BROKERS not set — using in-process event bus");
  }

  registerEventHandlers(eventBus);
  await eventBus.connect();

  return eventBus;
};

export const getEventBus = (): EventBus => {
  if (!eventBus) {
    throw new Error("Event bus not initialized. Call initEventBus() first.");
  }

  return eventBus;
};

export const shutdownEventBus = async () => {
  if (!eventBus) {
    return;
  }

  await eventBus.disconnect();
  eventBus = null;
};

export { publishEvent } from "./publisher";
export { EventTypes } from "./event.types";
export type { DomainEvent, EventPayloadMap } from "./event.types";

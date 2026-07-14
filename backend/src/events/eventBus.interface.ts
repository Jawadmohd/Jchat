import type { DomainEvent, EventHandler, EventType } from "./event.types";

export interface EventBus {
  subscribe<T extends EventType>(type: T, handler: EventHandler<T>): void;
  publish(event: DomainEvent): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

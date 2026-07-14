import type { EventBus } from "./eventBus.interface";
import type { DomainEvent, EventHandler, EventType } from "./event.types";

export class InProcessEventBus implements EventBus {
  private handlers = new Map<EventType, EventHandler[]>();

  subscribe<T extends EventType>(type: T, handler: EventHandler<T>) {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);
  }

  async connect() {
    // No external connection required.
  }

  async disconnect() {
    this.handlers.clear();
  }

  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) ?? [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler failed for ${event.type}:`, error);
      }
    }
  }
}

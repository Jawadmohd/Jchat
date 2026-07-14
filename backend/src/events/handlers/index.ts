import { registerCacheHandlers } from "./cache.handler";
import { registerSocketHandlers } from "./socket.handler";
import type { EventBus } from "../eventBus.interface";

export const registerEventHandlers = (bus: EventBus) => {
  registerCacheHandlers(bus);
  registerSocketHandlers(bus);
};

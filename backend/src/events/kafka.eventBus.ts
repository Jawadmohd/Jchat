import { Kafka, logLevel } from "kafkajs";
import type { EventBus } from "./eventBus.interface";
import type { DomainEvent, EventHandler, EventType } from "./event.types";

const TOPIC = process.env.KAFKA_EVENTS_TOPIC ?? "jchat.domain.events";
const GROUP_ID = process.env.KAFKA_CONSUMER_GROUP ?? "jchat-api";

export class KafkaEventBus implements EventBus {
  private kafka: Kafka;
  private producer: ReturnType<Kafka["producer"]> | null = null;
  private consumer: ReturnType<Kafka["consumer"]> | null = null;
  private handlers = new Map<EventType, EventHandler[]>();
  private connected = false;

  constructor(brokers: string[]) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? "jchat-api",
      brokers,
      logLevel: logLevel.ERROR,
    });
  }

  subscribe<T extends EventType>(type: T, handler: EventHandler<T>) {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);
  }

  async connect() {
    if (this.connected) {
      return;
    }

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: GROUP_ID });

    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPIC, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) {
          return;
        }

        try {
          const event = JSON.parse(message.value.toString()) as DomainEvent;
          await this.dispatch(event);
        } catch (error) {
          console.error("Failed to process Kafka event:", error);
        }
      },
    });

    this.connected = true;
    console.log(`Kafka event bus connected (topic: ${TOPIC})`);
  }

  async disconnect() {
    await this.producer?.disconnect();
    await this.consumer?.disconnect();
    this.producer = null;
    this.consumer = null;
    this.connected = false;
    this.handlers.clear();
  }

  async publish(event: DomainEvent) {
    if (!this.producer) {
      throw new Error("Kafka producer is not connected");
    }

    await this.producer.send({
      topic: TOPIC,
      messages: [
        {
          key: event.type,
          value: JSON.stringify(event),
        },
      ],
    });
  }

  private async dispatch(event: DomainEvent) {
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

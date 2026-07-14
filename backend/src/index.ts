import "dotenv/config";
import http from "http";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware";
import { initEventBus, shutdownEventBus } from "./events";
import routes from "./routes";
import { initSocket } from "./socket";
import { connectDatabase } from "./utils";
import { connectRedis } from "./utils/redis.util";
import { resetPresenceState } from "./services/presence/presence.service";

const app = express();
const PORT = process.env.PORT ?? 8000;
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

app.use("/api", routes);
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  await connectRedis();
  await resetPresenceState();

  const httpServer = http.createServer(app);
  initSocket(httpServer);
  await initEventBus();

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

const shutdown = async () => {
  await shutdownEventBus();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

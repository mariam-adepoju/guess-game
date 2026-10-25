import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";

import { createApp } from "./app.js";
import connectDB from "./config/db.js";
import { getServerConfig } from "./config/env.js";
import { registerSocketHandlers } from "./sockets/index.js";

const config = getServerConfig();
const httpServer = createServer(createApp(config));

const io = new Server(httpServer, {
  cors: { origin: config.clientUrl, methods: ["GET", "POST"] },
  maxHttpBufferSize: 100_000,
  pingTimeout: 20_000,
  pingInterval: 25_000,
});

registerSocketHandlers(io);

async function startServer(): Promise<void> {
  try {
    await connectDB(config.mongoUri);

    httpServer.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exit(1);
    });

    httpServer.listen(config.port, () => {
      console.info(`Server running on port ${config.port}`);
    });
  } catch (error: unknown) {
    console.error(
      "Application startup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exit(1);
  }
}

function shutdown(signal: string): void {
  console.info(`${signal} received. Shutting down...`);
  io.close(() => {
    void mongoose.connection.close().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

void startServer();

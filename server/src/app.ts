import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import type { ServerConfig } from "./config/env.js";

export function createApp({ clientUrl, isProduction }: ServerConfig) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: clientUrl, methods: ["GET"] }));
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    res
      .status(200)
      .json({ success: true, message: "Guessing Game API is running" });
  });

  app.use((_req, res) =>
    res.status(404).json({ success: false, message: "Not found" }),
  );
  return app;
}

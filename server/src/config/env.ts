export type ServerConfig = {
  port: number;
  clientUrl: string;
  mongoUri: string;
  isProduction: boolean;
};

export function getServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const isProduction = env.NODE_ENV === "production";
  const clientUrl =
    env.CLIENT_URL?.trim() || (isProduction ? "" : "http://localhost:5173");
  const mongoUri = env.MONGODB_URI?.trim() || "";
  const portValue = env.PORT?.trim() || "4000";
  const port = Number(portValue);

  if (!clientUrl) throw new Error("CLIENT_URL is required in production.");
  if (!mongoUri) throw new Error("MONGODB_URI is required.");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  let parsedClientUrl: URL;
  try {
    parsedClientUrl = new URL(clientUrl);
  } catch {
    throw new Error("CLIENT_URL must be a valid absolute URL.");
  }

  if (!["http:", "https:"].includes(parsedClientUrl.protocol)) {
    throw new Error("CLIENT_URL must use HTTP or HTTPS.");
  }
  if (isProduction && parsedClientUrl.protocol !== "https:") {
    throw new Error("CLIENT_URL must use HTTPS in production.");
  }

  return { port, clientUrl: parsedClientUrl.origin, mongoUri, isProduction };
}

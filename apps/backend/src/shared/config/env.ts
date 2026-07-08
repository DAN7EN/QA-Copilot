export type CloudflareAIGatewayConfig = {
  accountId: string;
  gatewayId: string;
  apiToken: string;
  timeoutMs: number;
};

export type AppConfig = {
  port: number;
  host: string;
  cloudflareAIGateway: CloudflareAIGatewayConfig;
  /** Vacío si no está configurada: la composición de dependencias decide entonces usar InMemory. */
  databaseUrl: string;
  /** Origen permitido por CORS para el frontend (Vite corre en :5173 por defecto). */
  corsOrigin: string;
};

const DEFAULT_CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS = 15_000;
const DEFAULT_CORS_ORIGIN = "http://localhost:5173";

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const corsOrigin = process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN;

  const cloudflareAIGateway: CloudflareAIGatewayConfig = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    gatewayId: process.env.CLOUDFLARE_AI_GATEWAY_ID ?? "",
    apiToken: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN ?? "",
    timeoutMs: Number(
      process.env.CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS ?? DEFAULT_CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS,
    ),
  };

  return { port, host, cloudflareAIGateway, databaseUrl, corsOrigin };
}

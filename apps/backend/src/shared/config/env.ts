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
};

const DEFAULT_CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS = 15_000;

export function loadConfig(): AppConfig {
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";

  const cloudflareAIGateway: CloudflareAIGatewayConfig = {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    gatewayId: process.env.CLOUDFLARE_AI_GATEWAY_ID ?? "",
    apiToken: process.env.CLOUDFLARE_AI_GATEWAY_TOKEN ?? "",
    timeoutMs: Number(
      process.env.CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS ?? DEFAULT_CLOUDFLARE_AI_GATEWAY_TIMEOUT_MS,
    ),
  };

  return { port, host, cloudflareAIGateway };
}

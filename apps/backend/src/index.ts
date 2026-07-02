import Fastify from "fastify";
import type { HealthResponse } from "@qa-copilot/shared";

// Sin variables de entorno en el Bootstrap: el puerto es una constante.
// La configuración por ambiente pertenece a fases posteriores.
const PORT = 3001;
const HOST = "0.0.0.0";

const app = Fastify({
  logger: true,
});

app.get("/health", async (): Promise<HealthResponse> => {
  return { status: "ok", service: "qa-copilot-api" };
});

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

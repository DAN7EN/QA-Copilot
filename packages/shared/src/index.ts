/**
 * Tipos compartidos entre frontend y backend.
 *
 * En el Bootstrap (Sprint 1A) este paquete solo define el contrato de /health.
 * Los tipos del dominio (Conversation, Message, etc.) se agregarán en fases posteriores.
 */

export type HealthResponse = {
  status: "ok";
  service: string;
};

/**
 * Forma estructural mínima que necesitan los adaptadores para loguear.
 * El logger de Fastify (Pino) ya la cumple, por lo que `app.log` puede
 * inyectarse directamente sin adaptar nada ni sumar una dependencia nueva.
 */
export type Logger = {
  info: (fields: Record<string, unknown>, message?: string) => void;
  warn: (fields: Record<string, unknown>, message?: string) => void;
  error: (fields: Record<string, unknown>, message?: string) => void;
};

/**
 * Metadata de una capacidad del sistema (Chat, Gherkin, Test Cases, ...).
 * Solo lo mínimo con valor hoy (YAGNI): qué es y cómo se identifica, no cómo
 * se ejecuta ni qué necesita — eso son responsabilidades separadas (ver
 * `ports/`), igual que el Model Registry no mezcla "qué modelo existe" con
 * "cómo se lo llama".
 */
export type Capability = {
  id: string;
  name: string;
  description: string;
};

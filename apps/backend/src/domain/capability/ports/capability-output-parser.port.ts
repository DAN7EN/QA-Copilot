/**
 * Punto de extensión para que cada capacidad decida cómo interpretar la
 * respuesta cruda del modelo (Chat: texto plano; Gherkin: un `.feature`;
 * Playwright: un archivo de test). Sin parsers reales todavía: solo el punto
 * de extensión, tal como pide el Sprint 6A.
 */
export interface CapabilityOutputParser<TOutput = unknown> {
  parse(rawOutput: string): TOutput;
}

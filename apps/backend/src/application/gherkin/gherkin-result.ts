/**
 * Salida estructurada de la capacidad Gherkin Generator. No es una entidad de
 * dominio (no se persiste, no tiene identidad ni ciclo de vida propio): es el
 * resultado de interpretar, una única vez, la respuesta cruda del modelo.
 */
export type GherkinScenario = {
  title: string;
  steps: string[];
};

export type GherkinResult = {
  title: string;
  feature: string;
  background?: string[];
  scenarios: GherkinScenario[];
  rawMarkdown: string;
};

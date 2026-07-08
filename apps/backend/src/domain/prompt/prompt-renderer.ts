import { MissingPromptVariablesError } from "./errors/prompt.errors.js";

const VARIABLE_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/**
 * Reemplaza placeholders `{{variable}}` por su valor. Sin motores externos:
 * una única pasada de regex es toda la "sintaxis" que este framework soporta,
 * a propósito (YAGNI) hasta que una capacidad futura demuestre necesitar más.
 */
export function renderPromptTemplate(
  promptId: string,
  template: string,
  variables: Readonly<Record<string, string>>,
): string {
  const missing = new Set<string>();

  const rendered = template.replace(VARIABLE_PATTERN, (_match, name: string) => {
    const value = variables[name];

    if (value === undefined) {
      missing.add(name);
      return "";
    }

    return value;
  });

  if (missing.size > 0) {
    throw new MissingPromptVariablesError(promptId, [...missing]);
  }

  return rendered;
}

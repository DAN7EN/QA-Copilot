import type { CapabilityOutputParser } from "../../domain/capability/ports/capability-output-parser.port.js";
import type { GherkinResult, GherkinScenario } from "./gherkin-result.js";

const CODE_FENCE_PATTERN = /^```[a-zA-Z]*\s*$/;

/** Quita un code fence envolvente (```gherkin ... ```), si el modelo agregó uno pese a la instrucción. */
function stripCodeFence(lines: string[]): string[] {
  if (lines.length >= 2 && CODE_FENCE_PATTERN.test(lines[0] ?? "") && lines.at(-1) === "```") {
    return lines.slice(1, -1);
  }

  return lines;
}

/**
 * Interpreta la respuesta cruda del modelo (markdown Gherkin) en un objeto
 * estructurado. Recorre línea por línea reconociendo únicamente las
 * secciones que Gherkin define (Feature, Background, Scenario): sin motor de
 * parsing ni regex complejas, a propósito (YAGNI).
 */
function parseGherkinMarkdown(rawMarkdown: string): GherkinResult {
  const lines = stripCodeFence(rawMarkdown.split("\n"));

  let title = "";
  const featureLines: string[] = [];
  let backgroundLines: string[] | undefined;
  const scenarios: GherkinScenario[] = [];

  type Section = "none" | "feature" | "background" | "scenario";
  let section: Section = "none";
  let currentScenario: GherkinScenario | null = null;

  function closeScenario(): void {
    if (currentScenario) {
      scenarios.push(currentScenario);
      currentScenario = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("Feature:")) {
      title = line.slice("Feature:".length).trim();
      section = "feature";
      continue;
    }

    if (line.startsWith("Background:")) {
      closeScenario();
      backgroundLines = [];
      section = "background";
      continue;
    }

    if (line.startsWith("Scenario:") || line.startsWith("Scenario Outline:")) {
      closeScenario();
      const scenarioTitle = line.slice(line.indexOf(":") + 1).trim();
      currentScenario = { title: scenarioTitle, steps: [] };
      section = "scenario";
      continue;
    }

    if (line.length === 0) {
      continue;
    }

    if (section === "feature") {
      featureLines.push(line);
    } else if (section === "background") {
      backgroundLines?.push(line);
    } else if (section === "scenario") {
      currentScenario?.steps.push(line);
    }
  }

  closeScenario();

  return {
    title,
    feature: featureLines.join("\n"),
    background: backgroundLines,
    scenarios,
    rawMarkdown,
  };
}

export function createGherkinOutputParser(): CapabilityOutputParser<GherkinResult> {
  return {
    parse: parseGherkinMarkdown,
  };
}

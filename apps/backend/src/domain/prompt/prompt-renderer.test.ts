import { describe, expect, it } from "vitest";
import { renderPromptTemplate } from "./prompt-renderer.js";
import { MissingPromptVariablesError } from "./errors/prompt.errors.js";

describe("renderPromptTemplate", () => {
  it("sustituye las variables presentes en el template", () => {
    const result = renderPromptTemplate("demo", "Hola {{name}}, hoy es {{day}}.", {
      name: "Ana",
      day: "lunes",
    });

    expect(result).toBe("Hola Ana, hoy es lunes.");
  });

  it("devuelve el template sin cambios si no tiene placeholders", () => {
    const result = renderPromptTemplate("demo", "Texto fijo sin variables.", {});

    expect(result).toBe("Texto fijo sin variables.");
  });

  it("lanza MissingPromptVariablesError listando todas las variables faltantes", () => {
    expect(() => renderPromptTemplate("demo", "{{a}} y {{b}}", { a: "1" })).toThrow(
      MissingPromptVariablesError,
    );

    try {
      renderPromptTemplate("demo", "{{a}} y {{b}}", {});
      expect.fail("debía lanzar MissingPromptVariablesError");
    } catch (error) {
      expect((error as Error).message).toContain("a");
      expect((error as Error).message).toContain("b");
    }
  });
});

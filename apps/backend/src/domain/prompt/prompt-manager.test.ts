import { describe, expect, it } from "vitest";
import { createPromptManager } from "./prompt-manager.js";
import { MissingPromptVariablesError } from "./errors/prompt.errors.js";
import type { PromptDefinition } from "./value-objects/prompt-definition.vo.js";

const testDefinition: PromptDefinition = {
  id: "test.greeting",
  name: "Test Greeting",
  version: "1.0.0",
  description: "Prompt de prueba",
  purpose: "Probar el Prompt Manager de forma aislada del registro real",
  template: "Hola {{name}}",
  variables: ["name"],
};

describe("createPromptManager", () => {
  it("resuelve, versiona y renderiza el prompt correcto", () => {
    const manager = createPromptManager(() => testDefinition);

    const result = manager.render({ id: "test.greeting", variables: { name: "Ana" } });

    expect(result).toBe("Hola Ana");
  });

  it("usa el mismo mecanismo del renderer para reportar variables faltantes", () => {
    const manager = createPromptManager(() => testDefinition);

    expect(() => manager.render({ id: "test.greeting" })).toThrow(MissingPromptVariablesError);
  });

  it("es el único que conoce el registro: quien lo usa solo pasa id/versión/variables", () => {
    const manager = createPromptManager((id, version) => {
      expect(id).toBe("test.greeting");
      expect(version).toBe("2.0.0");
      return testDefinition;
    });

    manager.render({ id: "test.greeting", version: "2.0.0", variables: { name: "Ana" } });
  });

  it("usa el Prompt Registry real por defecto (System Prompt del chat)", () => {
    const manager = createPromptManager();

    const result = manager.render({ id: "chat.system" });

    expect(result.length).toBeGreaterThan(0);
  });
});

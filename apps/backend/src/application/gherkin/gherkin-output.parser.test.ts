import { describe, expect, it } from "vitest";
import { createGherkinOutputParser } from "./gherkin-output.parser.js";

describe("GherkinOutputParser", () => {
  it("parsea Feature, Background y Scenarios en un objeto estructurado", () => {
    const parser = createGherkinOutputParser();
    const markdown = [
      "Feature: Login de usuario",
      "  Como usuario registrado",
      "  Quiero iniciar sesión",
      "",
      "  Background:",
      "    Given la página de login está abierta",
      "",
      "  Scenario: Login exitoso",
      "    Given credenciales válidas",
      "    When envío el formulario",
      "    Then veo el dashboard",
      "",
      "  Scenario: Login fallido",
      "    Given credenciales inválidas",
      "    When envío el formulario",
      "    Then veo un mensaje de error",
    ].join("\n");

    const result = parser.parse(markdown);

    expect(result.title).toBe("Login de usuario");
    expect(result.feature).toBe("Como usuario registrado\nQuiero iniciar sesión");
    expect(result.background).toEqual(["Given la página de login está abierta"]);
    expect(result.scenarios).toEqual([
      {
        title: "Login exitoso",
        steps: ["Given credenciales válidas", "When envío el formulario", "Then veo el dashboard"],
      },
      {
        title: "Login fallido",
        steps: [
          "Given credenciales inválidas",
          "When envío el formulario",
          "Then veo un mensaje de error",
        ],
      },
    ]);
    expect(result.rawMarkdown).toBe(markdown);
  });

  it("no exige Background: es opcional", () => {
    const parser = createGherkinOutputParser();
    const markdown = ["Feature: Búsqueda", "", "Scenario: Buscar producto", "Given ..."].join("\n");

    const result = parser.parse(markdown);

    expect(result.background).toBeUndefined();
    expect(result.scenarios).toHaveLength(1);
  });

  it("ignora un code fence envolvente si el modelo lo agrega", () => {
    const parser = createGherkinOutputParser();
    const markdown = ["```gherkin", "Feature: Login", "", "Scenario: OK", "Given algo", "```"].join(
      "\n",
    );

    const result = parser.parse(markdown);

    expect(result.title).toBe("Login");
    expect(result.scenarios).toEqual([{ title: "OK", steps: ["Given algo"] }]);
  });
});

import { describe, expect, it } from "vitest";
import { createListModelsUseCase } from "./list-models.use-case.js";

describe("ListModelsUseCase", () => {
  it("devuelve el catálogo de modelos disponibles", async () => {
    const useCase = createListModelsUseCase();

    const models = await useCase.execute();

    expect(models.length).toBeGreaterThan(0);
    expect(models.map((model) => model.getId().toString())).toContain("gemini-2.5-flash");
  });
});

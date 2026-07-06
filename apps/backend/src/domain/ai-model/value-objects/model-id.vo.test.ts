import { describe, expect, it } from "vitest";
import { ModelId } from "./model-id.vo.js";
import { InvalidModelIdError } from "../errors/ai-model.errors.js";

describe("ModelId", () => {
  it("reconstruye un identificador a partir de un string y preserva su valor", () => {
    const id = ModelId.fromString("gemini-2.5-flash");

    expect(id.toString()).toBe("gemini-2.5-flash");
  });

  it("dos identificadores con el mismo valor son iguales", () => {
    const first = ModelId.fromString("gemini-2.5-flash");
    const second = ModelId.fromString("gemini-2.5-flash");

    expect(first.equals(second)).toBe(true);
  });

  it("rechaza un identificador vacío", () => {
    expect(() => ModelId.fromString("   ")).toThrow(InvalidModelIdError);
  });
});

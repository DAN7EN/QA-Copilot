import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renderiza el encabezado principal", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("QA Copilot");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "./AppRoutes";

function renderAt(path: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("AppRoutes", () => {
  it("renderiza el shell con el estado vacío del chat en la ruta raíz", () => {
    const html = renderAt("/");

    expect(html).toContain("QA Copilot");
    expect(html).toContain("Nueva conversación");
  });

  it("renderiza la página 404 en rutas desconocidas", () => {
    const html = renderAt("/ruta-inexistente");

    expect(html).toContain("404");
  });
});

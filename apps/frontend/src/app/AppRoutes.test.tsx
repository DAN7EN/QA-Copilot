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
  it("renderiza la página de inicio en la ruta raíz", () => {
    const html = renderAt("/");

    expect(html).toContain("QA Copilot");
  });

  it("renderiza la página de chat en /chat", () => {
    const html = renderAt("/chat");

    expect(html).toContain("<h1>Chat</h1>");
  });

  it("renderiza la página 404 en rutas desconocidas", () => {
    const html = renderAt("/ruta-inexistente");

    expect(html).toContain("404");
  });

  it("incluye la navegación principal con el enlace al chat", () => {
    const html = renderAt("/");

    expect(html).toContain('href="/chat"');
  });
});

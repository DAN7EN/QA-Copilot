import { afterEach, describe, expect, it, vi } from "vitest";

describe("useUiStore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("colapsa el sidebar por default en viewports angostos (mobile)", async () => {
    vi.stubGlobal("window", { matchMedia: vi.fn().mockReturnValue({ matches: true }) });

    const { useUiStore } = await import("./ui.store");

    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });

  it("no colapsa el sidebar por default en viewports anchos", async () => {
    vi.stubGlobal("window", { matchMedia: vi.fn().mockReturnValue({ matches: false }) });

    const { useUiStore } = await import("./ui.store");

    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("no falla si window o matchMedia no están disponibles", async () => {
    const { useUiStore } = await import("./ui.store");

    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it("toggleSidebar invierte el estado", async () => {
    const { useUiStore } = await import("./ui.store");
    const initial = useUiStore.getState().sidebarCollapsed;

    useUiStore.getState().toggleSidebar();

    expect(useUiStore.getState().sidebarCollapsed).toBe(!initial);
  });
});

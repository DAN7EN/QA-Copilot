import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

const MOBILE_BREAKPOINT_QUERY = "(max-width: 768px)";

/**
 * Colapsa el sidebar por default en viewports angostos para no comerse toda
 * la pantalla al cargar. Solo se lee una vez al inicializar el store (no hay
 * listener de resize): el usuario sigue controlando el toggle manualmente
 * después, sin sorpresas al rotar o redimensionar la ventana.
 */
function getInitialSidebarCollapsed(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: getInitialSidebarCollapsed(),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

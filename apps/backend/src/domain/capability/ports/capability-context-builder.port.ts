/**
 * Punto de extensión para que cada capacidad construya el contexto que su
 * `CapabilityHandler` necesita (Chat: historial; Gherkin: historia de
 * usuario; Test Cases: criterios de aceptación; Playwright: escenarios).
 *
 * `TInput` es lo que la capacidad recibe desde afuera (por ejemplo, un id de
 * conversación); `TContext` es lo que arma para su propio Handler. Sin
 * implementaciones todavía: solo el punto de extensión, tal como pide el
 * Sprint 6A.
 */
export interface CapabilityContextBuilder<TInput = unknown, TContext = unknown> {
  build(input: TInput): TContext;
}

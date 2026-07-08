/**
 * Punto de extensión para que una capacidad ejecute su propia lógica sin
 * modificar el núcleo del framework. `TContext` es lo que produce el
 * `CapabilityContextBuilder` de esa capacidad; `TOutput` es lo que interpreta
 * su `CapabilityOutputParser`. El framework no conoce ni construye ninguno de
 * los dos: cada capacidad los define para sí misma.
 *
 * Sin implementaciones todavía (Sprint 6A prepara el framework, no las
 * capacidades). Cuando exista, por ejemplo, un Gherkin Handler, reutilizará
 * `PromptManager` internamente para renderizar sus propios prompts, tal como
 * ya lo hace `buildConversationContext` para Chat.
 */
export interface CapabilityHandler<TContext = unknown, TOutput = unknown> {
  execute(context: TContext): Promise<TOutput>;
}

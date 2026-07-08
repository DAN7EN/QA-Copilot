import { describe, expect, it } from "vitest";
import type { CapabilityContextBuilder } from "./ports/capability-context-builder.port.js";
import type { CapabilityHandler } from "./ports/capability-handler.port.js";
import type { CapabilityOutputParser } from "./ports/capability-output-parser.port.js";

/**
 * No hay capacidades reales todavía (Sprint 6A solo prepara los puntos de
 * extensión). Este test demuestra, con una capacidad ficticia mínima, que los
 * tres contratos encajan entre sí tal como los usará una capacidad futura:
 * ContextBuilder arma el contexto, Handler lo ejecuta, OutputParser
 * interpreta la respuesta cruda del modelo.
 */
type EchoContext = { instruction: string };
type EchoOutput = { shout: string };

function createEchoContextBuilder(): CapabilityContextBuilder<string, EchoContext> {
  return {
    build: (input) => ({ instruction: input }),
  };
}

function createEchoOutputParser(): CapabilityOutputParser<EchoOutput> {
  return {
    parse: (rawOutput) => ({ shout: rawOutput.toUpperCase() }),
  };
}

function createEchoHandler(
  outputParser: CapabilityOutputParser<EchoOutput>,
): CapabilityHandler<EchoContext, EchoOutput> {
  return {
    execute: async (context) => outputParser.parse(context.instruction),
  };
}

describe("capability extension points", () => {
  it("permiten componer una capacidad completa: contexto -> ejecución -> output", async () => {
    const contextBuilder = createEchoContextBuilder();
    const outputParser = createEchoOutputParser();
    const handler = createEchoHandler(outputParser);

    const context = contextBuilder.build("hola qa");
    const output = await handler.execute(context);

    expect(output).toEqual({ shout: "HOLA QA" });
  });
});

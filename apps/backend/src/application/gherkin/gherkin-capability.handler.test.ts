import { describe, expect, it, vi } from "vitest";
import { createGherkinCapabilityHandler } from "./gherkin-capability.handler.js";
import { createGherkinOutputParser } from "./gherkin-output.parser.js";
import { MessageContent } from "../../domain/conversation/value-objects/message-content.vo.js";
import { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../domain/conversation/ports/ai-provider.port.js";

function createFakeAIProvider(replyText: string): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create(replyText),
    streamReply(): AsyncIterable<AIGenerationChunk> {
      throw new Error("not used in this test");
    },
  };
}

describe("GherkinCapabilityHandler", () => {
  it("llama al AIProviderPort y parsea la respuesta con el OutputParser", async () => {
    const markdown = "Feature: Login\n\nScenario: OK\nGiven algo";
    const handler = createGherkinCapabilityHandler(
      createFakeAIProvider(markdown),
      createGherkinOutputParser(),
    );

    const result = await handler.execute({
      messages: [{ role: "system", content: "eres experto en BDD" }],
      modelId: ModelId.fromString("gemini-2.5-flash"),
    });

    expect(result.title).toBe("Login");
    expect(result.scenarios).toEqual([{ title: "OK", steps: ["Given algo"] }]);
    expect(result.rawMarkdown).toBe(markdown);
  });

  it("pasa messages, modelId y signal al AIProviderPort", async () => {
    const generateReply = vi.fn().mockResolvedValue(MessageContent.create("Feature: X"));
    const handler = createGherkinCapabilityHandler(
      {
        generateReply,
        streamReply: () => {
          throw new Error("not used in this test");
        },
      },
      createGherkinOutputParser(),
    );
    const controller = new AbortController();
    const messages = [{ role: "system", content: "eres experto en BDD" }];
    const modelId = ModelId.fromString("gemini-2.5-flash");

    await handler.execute({ messages, modelId, signal: controller.signal });

    expect(generateReply).toHaveBeenCalledWith(messages, modelId, controller.signal);
  });
});

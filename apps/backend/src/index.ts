import { buildServer } from "./infrastructure/http/server.js";
import { registerHealthRoutes } from "./interfaces/http/health.routes.js";
import { registerConversationRoutes } from "./interfaces/http/conversation/conversation.routes.js";
import { registerAIModelRoutes } from "./interfaces/http/ai-model/ai-model.routes.js";
import { InMemoryConversationRepository } from "./infrastructure/persistence/in-memory-conversation.repository.js";
import { createCloudflareAIGatewayProvider } from "./infrastructure/ai/cloudflare-ai-gateway.provider.js";
import { createInMemoryAIMetricsRecorder } from "./infrastructure/ai/ai-metrics.recorder.js";
import { createStartConversationUseCase } from "./application/conversation/start-conversation.use-case.js";
import { createSendMessageUseCase } from "./application/conversation/send-message.use-case.js";
import { createGetConversationUseCase } from "./application/conversation/get-conversation.use-case.js";
import { createGenerateAssistantReplyUseCase } from "./application/conversation/generate-assistant-reply.use-case.js";
import { createListModelsUseCase } from "./application/ai-model/list-models.use-case.js";
import { loadConfig } from "./shared/config/env.js";

const app = buildServer();
registerHealthRoutes(app);

const { port, host, cloudflareAIGateway } = loadConfig();

const conversationRepository = new InMemoryConversationRepository();
const aiMetricsRecorder = createInMemoryAIMetricsRecorder();
const aiProvider = createCloudflareAIGatewayProvider(
  cloudflareAIGateway,
  app.log,
  aiMetricsRecorder,
);

registerConversationRoutes(app, {
  startConversation: createStartConversationUseCase(conversationRepository),
  sendMessage: createSendMessageUseCase(conversationRepository),
  getConversation: createGetConversationUseCase(conversationRepository),
  generateAssistantReply: createGenerateAssistantReplyUseCase(conversationRepository, aiProvider),
});

registerAIModelRoutes(app, {
  listModels: createListModelsUseCase(),
});

const start = async (): Promise<void> => {
  try {
    await app.listen({ port, host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

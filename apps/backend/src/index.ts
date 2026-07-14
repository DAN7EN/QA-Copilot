import { buildServer } from "./infrastructure/http/server.js";
import { registerHealthRoutes } from "./interfaces/http/health.routes.js";
import { registerConversationRoutes } from "./interfaces/http/conversation/conversation.routes.js";
import { registerAIModelRoutes } from "./interfaces/http/ai-model/ai-model.routes.js";
import { registerCapabilityRoutes } from "./interfaces/http/capability/capability.routes.js";
import { registerGherkinRoutes } from "./interfaces/http/gherkin/gherkin.routes.js";
import type { ConversationRepositoryPort } from "./domain/conversation/ports/conversation-repository.port.js";
import { InMemoryConversationRepository } from "./infrastructure/persistence/in-memory-conversation.repository.js";
import { PostgresConversationRepository } from "./infrastructure/persistence/postgres-conversation.repository.js";
import { createPostgresPool } from "./infrastructure/persistence/postgres-pool.js";
import { createCloudflareAIGatewayProvider } from "./infrastructure/ai/cloudflare-ai-gateway.provider.js";
import { createInMemoryAIMetricsRecorder } from "./infrastructure/ai/ai-metrics.recorder.js";
import { createPromptManager } from "./domain/prompt/prompt-manager.js";
import { createStartConversationUseCase } from "./application/conversation/start-conversation.use-case.js";
import { createSendMessageUseCase } from "./application/conversation/send-message.use-case.js";
import { createGetConversationUseCase } from "./application/conversation/get-conversation.use-case.js";
import { createGenerateAssistantReplyUseCase } from "./application/conversation/generate-assistant-reply.use-case.js";
import { createStreamAssistantReplyUseCase } from "./application/conversation/stream-assistant-reply.use-case.js";
import { createRenameConversationUseCase } from "./application/conversation/rename-conversation.use-case.js";
import { createDeleteConversationUseCase } from "./application/conversation/delete-conversation.use-case.js";
import { createListModelsUseCase } from "./application/ai-model/list-models.use-case.js";
import { createListCapabilitiesUseCase } from "./application/capability/list-capabilities.use-case.js";
import { createListConversationsUseCase } from "./application/conversation/list-conversations.use-case.js";
import { createGenerateGherkinUseCase } from "./application/gherkin/generate-gherkin.use-case.js";
import { createGherkinCapabilityContextBuilder } from "./application/gherkin/gherkin-context.builder.js";
import { createGherkinCapabilityHandler } from "./application/gherkin/gherkin-capability.handler.js";
import { createGherkinOutputParser } from "./application/gherkin/gherkin-output.parser.js";
import { loadConfig } from "./shared/config/env.js";

const { port, host, cloudflareAIGateway, databaseUrl, corsOrigin } = loadConfig();

const app = buildServer(corsOrigin);
registerHealthRoutes(app);

// Única decisión de qué repositorio usar: aquí, en la composición de
// dependencias. El dominio y los casos de uso solo conocen `ConversationRepositoryPort`.
const conversationRepository: ConversationRepositoryPort = databaseUrl
  ? new PostgresConversationRepository(createPostgresPool(databaseUrl))
  : new InMemoryConversationRepository();
const aiMetricsRecorder = createInMemoryAIMetricsRecorder();
const aiProvider = createCloudflareAIGatewayProvider(
  cloudflareAIGateway,
  app.log,
  aiMetricsRecorder,
);
const promptManager = createPromptManager();

registerConversationRoutes(
  app,
  {
    startConversation: createStartConversationUseCase(conversationRepository),
    sendMessage: createSendMessageUseCase(conversationRepository),
    getConversation: createGetConversationUseCase(conversationRepository),
    listConversations: createListConversationsUseCase(conversationRepository),
    generateAssistantReply: createGenerateAssistantReplyUseCase(
      conversationRepository,
      aiProvider,
      promptManager,
    ),
    streamAssistantReply: createStreamAssistantReplyUseCase(
      conversationRepository,
      aiProvider,
      promptManager,
    ),
    renameConversation: createRenameConversationUseCase(conversationRepository),
    deleteConversation: createDeleteConversationUseCase(conversationRepository),
  },
  corsOrigin,
);

registerAIModelRoutes(app, {
  listModels: createListModelsUseCase(),
});

registerCapabilityRoutes(app, {
  listCapabilities: createListCapabilitiesUseCase(),
});

const gherkinOutputParser = createGherkinOutputParser();
registerGherkinRoutes(app, {
  generateGherkin: createGenerateGherkinUseCase(
    conversationRepository,
    createGherkinCapabilityContextBuilder(promptManager),
    createGherkinCapabilityHandler(aiProvider, gherkinOutputParser),
  ),
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

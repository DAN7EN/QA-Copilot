-- Sprint 6B: persistencia de Conversation y Message.
-- Únicamente lo que el dominio actual necesita (YAGNI): sin columnas ni
-- tablas pensadas para funcionalidades futuras (prompts, capabilities,
-- métricas, usuarios, etc. no se persisten todavía).

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- La lista de conversaciones (GET /api/v1/conversations) ordena por esta columna.
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations (updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);

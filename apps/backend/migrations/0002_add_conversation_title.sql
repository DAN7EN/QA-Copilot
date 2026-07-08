-- Sprint 8.5: título opcional de conversación (rename desde la UI).
-- NULL cuando el usuario no lo renombró todavía: el frontend deriva un
-- título del primer mensaje en ese caso.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title TEXT;

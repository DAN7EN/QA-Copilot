import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPostgresPool } from "./postgres-pool.js";
import { loadConfig } from "../../shared/config/env.js";

/**
 * Runner de migraciones mínimo (sin librería de migraciones): aplica, en
 * orden, los archivos .sql de `migrations/` que todavía no figuren en
 * `schema_migrations`. Permite recrear la base de datos desde cero
 * simplemente corriendo `pnpm migrate` contra una base vacía.
 */
const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../migrations",
);

async function run(): Promise<void> {
  const { databaseUrl } = loadConfig();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  const pool = createPostgresPool(databaseUrl);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const applied = await pool.query<{ name: string }>("SELECT name FROM schema_migrations");
    const appliedNames = new Set(applied.rows.map((row) => row.name));

    const pendingFiles = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .filter((file) => !appliedNames.has(file));

    for (const file of pendingFiles) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied migration: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log(pendingFiles.length > 0 ? "Migrations applied." : "Database already up to date.");
  } finally {
    await pool.end();
  }
}

run().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});

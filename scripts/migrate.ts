import { config } from "dotenv";
import { Client } from "pg";
import { readdir, readFile } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum diatur di .env.local");
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(process.cwd(), "database", "migrations");
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("Tidak ada file migration SQL yang ditemukan.");
      return;
    }

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [file]
      );

      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        console.log(`Lewati: ${file} sudah pernah dijalankan.`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, "utf8");

      console.log(`Menjalankan migration: ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`Selesai: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Semua migration selesai.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration gagal:");
  console.error(error);
  process.exit(1);
});

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur di .env.local");
}

declare global {
  var pgPool: Pool | undefined;
}

export const db =
  global.pgPool ??
  new Pool({
    connectionString,
  });

if (process.env.NODE_ENV !== "production") {
  global.pgPool = db;
}

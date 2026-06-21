import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("../src/lib/db/pool");

  const result = await db.query(
    "SELECT current_database() AS database_name, current_user AS user_name, NOW() AS server_time"
  );

  console.log("Koneksi database berhasil:");
  console.table(result.rows);

  await db.end();
}

main().catch((error) => {
  console.error("Koneksi database gagal:");
  console.error(error);
  process.exit(1);
});

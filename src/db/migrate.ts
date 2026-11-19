import "dotenv/config";
import { migrate } from "drizzle-orm/libsql/migrator";
import { client, db } from "./index";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./local.db";
  if (url.startsWith("file:")) {
    await client.execute("PRAGMA foreign_keys = ON;");
  }

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migraciones aplicadas correctamente.");
}

main()
  .catch((error) => {
    console.error("Error al ejecutar migraciones:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.close();
  });

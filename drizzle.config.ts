import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;
const esRemota = url.startsWith("libsql://") || url.startsWith("https://");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: esRemota ? "turso" : "sqlite",
  dbCredentials: esRemota ? { url, authToken } : { url },
});

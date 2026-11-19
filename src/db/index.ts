import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const rawAuthToken = process.env.DATABASE_AUTH_TOKEN?.trim();
const authToken = rawAuthToken ? rawAuthToken : undefined;

const globalForDb = globalThis as unknown as {
  libsqlClient?: Client;
};

export const client =
  globalForDb.libsqlClient ??
  createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsqlClient = client;
}

export const db = drizzle(client, { schema });

export type DbClient = typeof db;
export type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];
export type DbOrTx = DbClient | DbTransaction;

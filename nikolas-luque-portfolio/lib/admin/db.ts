import "server-only";
import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  nikolasPgPool?: Pool;
};

function createPool() {
  const required = [
    "PGHOST",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGPASSWORD",
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Falta la variable de entorno ${key}`);
    }
  }

  return new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 5,
    connectionTimeoutMillis: 5000,
  });
}

export const db = globalForPg.nikolasPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.nikolasPgPool = db;
}

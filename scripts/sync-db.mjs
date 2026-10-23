import "dotenv/config";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL;
const prismaCli = resolve("node_modules/prisma/build/index.js");

function runPrisma(args, options = {}) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    stdio: "inherit",
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  return result;
}

async function syncRemoteSchema() {
  const diff = spawnSync(
    process.execPath,
    [
      prismaCli,
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema=prisma/schema.prisma",
      "--script",
    ],
    { encoding: "utf8" },
  );

  if (diff.error) throw diff.error;
  if (diff.status !== 0) {
    console.error(diff.stderr || diff.stdout);
    process.exit(diff.status ?? 1);
  }

  const sql = diff.stdout
    .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
    .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
    .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

  if (!sql.trim()) {
    console.log("[db:sync] Nenhuma tabela a criar.");
    return;
  }

  const client = createClient({
    url: databaseUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await client.executeMultiple(sql);
    console.log("[db:sync] Schema sincronizado no Turso.");
  } finally {
    client.close();
  }
}

async function main() {
  if (!databaseUrl) {
    console.warn(
      "[db:sync] DATABASE_URL não definida; sincronização ignorada.",
    );
    return;
  }

  if (databaseUrl.startsWith("file:") || databaseUrl.startsWith("sqlite:")) {
    runPrisma(["db", "push"]);
    return;
  }

  if (
    databaseUrl.startsWith("libsql:") ||
    databaseUrl.startsWith("https:") ||
    databaseUrl.startsWith("http:")
  ) {
    await syncRemoteSchema();
    return;
  }

  console.warn(
    "[db:sync] Protocolo não suportado em DATABASE_URL; sincronização ignorada.",
  );
}

main().catch((error) => {
  console.error("[db:sync] Falha ao sincronizar o banco:", error);
  process.exit(1);
});

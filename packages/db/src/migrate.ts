import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const client = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDirectory = new URL("../migrations", import.meta.url);
const migrationFileNames = (await readdir(migrationsDirectory)).filter((fileName) => fileName.endsWith(".sql")).sort();

for (const migrationFileName of migrationFileNames) {
  const migrationPath = join(migrationsDirectory.pathname, migrationFileName);
  const sql = await readFile(migrationPath, "utf8");
  await client.unsafe(sql);
  console.log(`Applied ${migrationFileName}`);
}

await client.end();

console.log("Drizzle migrations applied.");

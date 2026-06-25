import { createDemoSeedData } from "./demoData.js";
import { createPostgresCueRepository } from "./postgresRepository.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed Postgres.");
}

const repository = createPostgresCueRepository(databaseUrl);
await repository.upsertSeedData(createDemoSeedData());

console.log("Demo H0 workspace seeded.");

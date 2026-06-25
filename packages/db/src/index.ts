export { createDemoSeedData, demoWorkspaceId, demoWorkspaceSlug } from "./demoData.js";
export { createInMemoryCueRepository, getDefaultWorkspaceSlug, InMemoryCueRepository } from "./inMemoryRepository.js";
export { createPostgresCueRepository, createWorkflowRunRecord, PostgresCueRepository } from "./postgresRepository.js";
export type {
  AppendChatExchangeInput,
  CreateApprovalInput,
  CreateChatThreadInput,
  CueRepository,
  DemoSeedData,
  LaunchReadinessContext,
} from "./repository.js";

import { createDemoSeedData, demoWorkspaceSlug } from "./demoData.js";
import { createInMemoryCueRepository } from "./inMemoryRepository.js";
import { createPostgresCueRepository } from "./postgresRepository.js";
import type { CueRepository } from "./repository.js";

const globalRepositoryCache = globalThis as typeof globalThis & {
  cueRepository?: CueRepository;
};

export function getCueRepository(): CueRepository {
  if (globalRepositoryCache.cueRepository) {
    return globalRepositoryCache.cueRepository;
  }

  const databaseUrl = process.env.DATABASE_URL;
  globalRepositoryCache.cueRepository = databaseUrl
    ? createPostgresCueRepository(databaseUrl)
    : createInMemoryCueRepository();
  return globalRepositoryCache.cueRepository;
}

export async function ensureDemoData(repository: CueRepository, workspaceSlug = process.env.CUE_WORKSPACE_SLUG ?? demoWorkspaceSlug): Promise<void> {
  const workspace = await repository.getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    await repository.upsertSeedData(createDemoSeedData());
  }
}

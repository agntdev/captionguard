import { createRequire } from "node:module";
import type { StorageAdapter } from "grammy";
import { MemorySessionStorage } from "./toolkit/session/memory.js";
import { RedisSessionStorage, type RedisLike } from "./toolkit/session/redis.js";

// =============================================================================
// Durable domain storage — group settings + audit log.
//
// Uses the toolkit's Redis-backed storage when REDIS_URL is set, in-memory
// otherwise (development / test harness). Separate from grammY session storage.
// =============================================================================

export interface GroupSettings {
  enforcement_enabled: boolean;
  admin_notifications: boolean;
  in_group_notices: boolean;
  audit_retention_days: number;
}

export interface AuditEntry {
  timestamp: number;
  user_id: number;
  username: string;
  message_id: number;
  caption_present: boolean;
  group_id: number;
  appeal_requested?: boolean;
}

const DEFAULT_SETTINGS: GroupSettings = {
  enforcement_enabled: true,
  admin_notifications: true,
  in_group_notices: true,
  audit_retention_days: 30,
};

let settingsAdapter: StorageAdapter<GroupSettings> | null = null;
let auditAdapter: StorageAdapter<AuditEntry[]> | null = null;

function getRedisClient(): RedisLike | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ioredis: any = require("ioredis");
  const Redis = ioredis.default ?? ioredis.Redis ?? ioredis;
  return new Redis(url, { maxRetriesPerRequest: null, lazyConnect: false }) as RedisLike;
}

function resolveStorage<T>(prefix: string): StorageAdapter<T> {
  const client = getRedisClient();
  if (client) return new RedisSessionStorage<T>(client, prefix);
  return new MemorySessionStorage<T>();
}

function getSettingsAdapter(): StorageAdapter<GroupSettings> {
  if (!settingsAdapter) settingsAdapter = resolveStorage("gset:");
  return settingsAdapter;
}

function getAuditAdapter(): StorageAdapter<AuditEntry[]> {
  if (!auditAdapter) auditAdapter = resolveStorage("audit:");
  return auditAdapter;
}

export async function getGroupSettings(groupId: number): Promise<GroupSettings> {
  const adapter = getSettingsAdapter();
  const stored = await adapter.read(String(groupId));
  return stored ?? { ...DEFAULT_SETTINGS };
}

export async function saveGroupSettings(groupId: number, settings: GroupSettings): Promise<void> {
  const adapter = getSettingsAdapter();
  await adapter.write(String(groupId), settings);
}

export async function addAuditEntry(groupId: number, entry: AuditEntry): Promise<void> {
  const adapter = getAuditAdapter();
  const key = String(groupId);
  const existing = (await adapter.read(key)) ?? [];
  existing.push(entry);
  const cutoff = Date.now() - (await getGroupSettings(groupId)).audit_retention_days * 86400_000;
  const filtered = existing.filter((e) => e.timestamp >= cutoff);
  await adapter.write(key, filtered);
}

export async function getAuditLog(groupId: number, limit = 20): Promise<AuditEntry[]> {
  const adapter = getAuditAdapter();
  const entries = (await adapter.read(String(groupId))) ?? [];
  return entries.slice(-limit).reverse();
}

export function isAdmin(ctx: { chat?: { type?: string }; from?: { id?: number } }): boolean {
  if (ctx.chat?.type === "private") return true;
  return false;
}

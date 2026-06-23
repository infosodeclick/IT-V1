import "server-only";

import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

import { seedAuditLogs, seedRecords, seedSettings } from "@/lib/seed";
import type { AppRecord, AppSetting, AppUser, AuditLog, RecordMeta } from "@/lib/types";

const { Pool } = pg;

type JsonDb = {
  users: AppUser[];
  records: AppRecord[];
  auditLogs: AuditLog[];
  settings: AppSetting[];
};

type RecordInput = {
  module: string;
  code?: string | null;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  owner?: string | null;
  department?: string | null;
  dueDate?: string | null;
  costMonthly?: number | null;
  meta?: RecordMeta;
};

let pool: InstanceType<typeof Pool> | null = null;
let initPromise: Promise<void> | null = null;

const localDbPath = path.join(process.cwd(), "data", "local-db.json");

function hasPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    const needsSsl = process.env.PGSSLMODE === "require" || process.env.DATABASE_URL.includes("sslmode=require");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

async function ensurePostgres() {
  if (!hasPostgres()) return;
  if (!initPromise) {
    initPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS app_users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL,
          department TEXT NOT NULL,
          phone TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          last_login TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS app_records (
          id TEXT PRIMARY KEY,
          module TEXT NOT NULL,
          code TEXT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT,
          priority TEXT,
          category TEXT,
          owner TEXT,
          department TEXT,
          due_date DATE,
          cost_monthly NUMERIC(12, 2),
          meta JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_app_records_module ON app_records(module);
        CREATE INDEX IF NOT EXISTS idx_app_records_status ON app_records(status);

        CREATE TABLE IF NOT EXISTS app_audit_logs (
          id TEXT PRIMARY KEY,
          actor_id TEXT,
          actor_name TEXT NOT NULL,
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          record_id TEXT,
          ip_address TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      const existing = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM app_users");
      if (Number(existing.rows[0]?.count || 0) > 0) return;

      const passwordHash = await bcrypt.hash("Admin@1234", 10);
      const createdAt = new Date().toISOString();

      await db.query(
        `INSERT INTO app_users (id, username, email, password_hash, full_name, role, department, phone, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        ["admin", "admin", "admin@company.local", passwordHash, "System Administrator", "super_admin", "IT Department", "02-000-0000", "active", createdAt]
      );

      for (const item of seedRecords) {
        await insertRecordPostgres(db, item);
      }

      for (const item of seedAuditLogs) {
        await db.query(
          `INSERT INTO app_audit_logs (id, actor_id, actor_name, module, action, record_id, ip_address, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [item.id, item.actorId, item.actorName, item.module, item.action, item.recordId, item.ipAddress, item.createdAt]
        );
      }

      for (const item of seedSettings) {
        await db.query(
          `INSERT INTO app_settings (key, value, updated_at) VALUES ($1,$2::jsonb,$3)`,
          [item.key, JSON.stringify(item.value), item.updatedAt]
        );
      }
    })();
  }

  await initPromise;
}

async function insertRecordPostgres(db: InstanceType<typeof Pool>, item: AppRecord) {
  await db.query(
    `INSERT INTO app_records
       (id, module, code, title, description, status, priority, category, owner, department, due_date, cost_monthly, meta, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)
     ON CONFLICT (id) DO NOTHING`,
    [
      item.id,
      item.module,
      item.code,
      item.title,
      item.description,
      item.status,
      item.priority,
      item.category,
      item.owner,
      item.department,
      item.dueDate,
      item.costMonthly,
      JSON.stringify(item.meta),
      item.createdAt,
      item.updatedAt
    ]
  );
}

async function createSeedDb(): Promise<JsonDb> {
  const passwordHash = await bcrypt.hash("Admin@1234", 10);
  const createdAt = new Date().toISOString();

  return {
    users: [
      {
        id: "admin",
        username: "admin",
        email: "admin@company.local",
        passwordHash,
        fullName: "System Administrator",
        role: "super_admin",
        department: "IT Department",
        phone: "02-000-0000",
        status: "active",
        lastLogin: null,
        createdAt,
        updatedAt: createdAt
      }
    ],
    records: [...seedRecords],
    auditLogs: [...seedAuditLogs],
    settings: [...seedSettings]
  };
}

async function readJsonDb(): Promise<JsonDb> {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });

  try {
    const raw = await fs.readFile(localDbPath, "utf8");
    return JSON.parse(raw) as JsonDb;
  } catch {
    const db = await createSeedDb();
    await writeJsonDb(db);
    return db;
  }
}

async function writeJsonDb(db: JsonDb) {
  await fs.mkdir(path.dirname(localDbPath), { recursive: true });
  await fs.writeFile(localDbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    fullName: String(row.full_name),
    role: String(row.role),
    department: String(row.department),
    phone: row.phone ? String(row.phone) : null,
    status: String(row.status),
    lastLogin: row.last_login ? new Date(String(row.last_login)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function dateOnly(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return text;
}

function rowToRecord(row: Record<string, unknown>): AppRecord {
  return {
    id: String(row.id),
    module: String(row.module),
    code: row.code ? String(row.code) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    priority: row.priority ? String(row.priority) : null,
    category: row.category ? String(row.category) : null,
    owner: row.owner ? String(row.owner) : null,
    department: row.department ? String(row.department) : null,
    dueDate: dateOnly(row.due_date),
    costMonthly: row.cost_monthly == null ? null : Number(row.cost_monthly),
    meta: (row.meta || {}) as RecordMeta,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function auditToRecord(item: AuditLog): AppRecord {
  return {
    id: item.id,
    module: "audit-log",
    code: item.recordId || item.id,
    title: item.action,
    description: `${item.actorName} ${item.action} ${item.module}`,
    status: "บันทึกแล้ว",
    priority: null,
    category: item.module,
    owner: item.actorName,
    department: null,
    dueDate: null,
    costMonthly: null,
    meta: { ipAddress: item.ipAddress || "-" },
    createdAt: item.createdAt,
    updatedAt: item.createdAt
  };
}

function filterRecords(records: AppRecord[], filters?: Record<string, string | undefined>) {
  if (!filters) return records;

  const q = filters.q?.trim().toLowerCase();
  const status = filters.status && filters.status !== "ทั้งหมด" ? filters.status : "";
  const category = filters.category && filters.category !== "ทั้งหมด" ? filters.category : "";
  const priority = filters.priority && filters.priority !== "ทั้งหมด" ? filters.priority : "";

  return records.filter((record) => {
    if (status && record.status !== status) return false;
    if (category && record.category !== category) return false;
    if (priority && record.priority !== priority) return false;

    if (!q) return true;

    const haystack = [
      record.code,
      record.title,
      record.description,
      record.status,
      record.priority,
      record.category,
      record.owner,
      record.department,
      JSON.stringify(record.meta)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export async function getUserByUsername(login: string) {
  const key = login.trim().toLowerCase();

  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1", [key]);
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  const db = await readJsonDb();
  return db.users.find((user) => user.username.toLowerCase() === key || user.email.toLowerCase() === key) || null;
}

export async function getUserById(id: string) {
  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_users WHERE id = $1 LIMIT 1", [id]);
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  const db = await readJsonDb();
  return db.users.find((user) => user.id === id) || null;
}

export async function touchLastLogin(userId: string) {
  const timestamp = new Date().toISOString();

  if (hasPostgres()) {
    await ensurePostgres();
    await getPool().query("UPDATE app_users SET last_login = $1, updated_at = $1 WHERE id = $2", [timestamp, userId]);
    return;
  }

  const db = await readJsonDb();
  db.users = db.users.map((user) => (user.id === userId ? { ...user, lastLogin: timestamp, updatedAt: timestamp } : user));
  await writeJsonDb(db);
}

export async function listRecords(module: string, filters?: Record<string, string | undefined>) {
  if (module === "audit-log") {
    return listAuditRecords(filters);
  }

  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_records WHERE module = $1 ORDER BY created_at DESC", [module]);
    return filterRecords(result.rows.map(rowToRecord), filters);
  }

  const db = await readJsonDb();
  return filterRecords(
    db.records
      .filter((record) => record.module === module)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    filters
  );
}

export async function listAllRecords() {
  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_records ORDER BY created_at DESC");
    return result.rows.map(rowToRecord);
  }

  const db = await readJsonDb();
  return db.records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function countRecords(module: string) {
  if (module === "audit-log") {
    const items = await listAuditRecords();
    return items.length;
  }

  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query<{ count: string }>("SELECT COUNT(*)::text AS count FROM app_records WHERE module = $1", [module]);
    return Number(result.rows[0]?.count || 0);
  }

  const db = await readJsonDb();
  return db.records.filter((record) => record.module === module).length;
}

export async function createRecord(input: RecordInput, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  const item: AppRecord = {
    id: randomUUID(),
    module: input.module,
    code: input.code,
    title: input.title,
    description: input.description || null,
    status: input.status || null,
    priority: input.priority || null,
    category: input.category || null,
    owner: input.owner || null,
    department: input.department || null,
    dueDate: input.dueDate || null,
    costMonthly: input.costMonthly ?? null,
    meta: input.meta || {},
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (hasPostgres()) {
    await ensurePostgres();
    await insertRecordPostgres(getPool(), item);
  } else {
    const db = await readJsonDb();
    db.records.unshift(item);
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module: item.module,
    action: "create",
    recordId: item.id
  });

  return item;
}

export async function updateRecordStatus(id: string, status: string, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  let module = "records";

  if (hasPostgres()) {
    await ensurePostgres();
    const current = await getPool().query("SELECT module FROM app_records WHERE id = $1", [id]);
    module = current.rows[0]?.module || module;
    await getPool().query("UPDATE app_records SET status = $1, updated_at = $2 WHERE id = $3", [status, timestamp, id]);
  } else {
    const db = await readJsonDb();
    db.records = db.records.map((record) => {
      if (record.id !== id) return record;
      module = record.module;
      return { ...record, status, updatedAt: timestamp };
    });
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module,
    action: `update_status:${status}`,
    recordId: id
  });
}

export async function listAuditRecords(filters?: Record<string, string | undefined>) {
  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_audit_logs ORDER BY created_at DESC LIMIT 200");
    return filterRecords(
      result.rows.map((row) =>
        auditToRecord({
          id: String(row.id),
          actorId: row.actor_id ? String(row.actor_id) : null,
          actorName: String(row.actor_name),
          module: String(row.module),
          action: String(row.action),
          recordId: row.record_id ? String(row.record_id) : null,
          ipAddress: row.ip_address ? String(row.ip_address) : null,
          createdAt: new Date(String(row.created_at)).toISOString()
        })
      ),
      filters
    );
  }

  const db = await readJsonDb();
  return filterRecords(
    db.auditLogs.map(auditToRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    filters
  );
}

async function addAuditLog(input: {
  actor?: AppUser | null;
  module: string;
  action: string;
  recordId?: string | null;
  ipAddress?: string | null;
}) {
  const timestamp = new Date().toISOString();
  const item: AuditLog = {
    id: randomUUID(),
    actorId: input.actor?.id || null,
    actorName: input.actor?.fullName || "System",
    module: input.module,
    action: input.action,
    recordId: input.recordId || null,
    ipAddress: input.ipAddress || "127.0.0.1",
    createdAt: timestamp
  };

  if (hasPostgres()) {
    await getPool().query(
      `INSERT INTO app_audit_logs (id, actor_id, actor_name, module, action, record_id, ip_address, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [item.id, item.actorId, item.actorName, item.module, item.action, item.recordId, item.ipAddress, item.createdAt]
    );
    return;
  }

  const db = await readJsonDb();
  db.auditLogs.unshift(item);
  await writeJsonDb(db);
}

export async function getSettings() {
  if (hasPostgres()) {
    await ensurePostgres();
    const result = await getPool().query("SELECT * FROM app_settings WHERE key = 'system' LIMIT 1");
    return (result.rows[0]?.value || seedSettings[0].value) as RecordMeta;
  }

  const db = await readJsonDb();
  return db.settings.find((setting) => setting.key === "system")?.value || seedSettings[0].value;
}

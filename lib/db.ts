import "server-only";

import bcrypt from "bcryptjs";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg, { type QueryResult } from "pg";

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

type UserAccountInput = {
  code?: string | null;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  department: string;
  phone?: string | null;
  status?: string | null;
};

type ProfileInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  lineUserId?: string | null;
  password?: string | null;
};

type SystemSettingsInput = {
  systemName?: string | null;
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  lowSla?: number | null;
  mediumSla?: number | null;
  highSla?: number | null;
  criticalSla?: number | null;
  itemsPerPage?: number | null;
  maxUploadMb?: number | null;
};

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
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

async function insertRecordPostgres(db: Queryable, item: AppRecord) {
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

async function upsertRecordPostgres(db: Queryable, item: AppRecord) {
  await db.query(
    `INSERT INTO app_records
       (id, module, code, title, description, status, priority, category, owner, department, due_date, cost_monthly, meta, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)
     ON CONFLICT (id) DO UPDATE SET
       code = EXCLUDED.code,
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       status = EXCLUDED.status,
       priority = EXCLUDED.priority,
       category = EXCLUDED.category,
       owner = EXCLUDED.owner,
       department = EXCLUDED.department,
       due_date = EXCLUDED.due_date,
       cost_monthly = EXCLUDED.cost_monthly,
       meta = EXCLUDED.meta,
       updated_at = EXCLUDED.updated_at`,
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

function duplicateUserError() {
  return new Error("DUPLICATE_USER");
}

function invalidInputError() {
  return new Error("INVALID_INPUT");
}

function normalizeUserStatus(status?: string | null) {
  const value = (status || "active").trim().toLowerCase();
  if (value === "inactive" || value === "disabled" || value === "ปิด") return "inactive";
  return "active";
}

function userRecordId(userId: string) {
  return userId === "admin" ? "user-record-admin" : `user-record-${userId}`;
}

function profileRecordId(userId: string) {
  return userId === "admin" ? "profile-record" : `profile-record-${userId}`;
}

function userRecordFromUser(user: AppUser, timestamp: string, code?: string | null): AppRecord {
  return {
    id: userRecordId(user.id),
    module: "users",
    code: code || (user.id === "admin" ? "USR-00001" : null),
    title: user.fullName,
    description: "บัญชีผู้ใช้งานระบบ",
    status: user.status,
    priority: null,
    category: user.role,
    owner: user.username,
    department: user.department,
    dueDate: null,
    costMonthly: null,
    meta: {
      email: user.email,
      phone: user.phone || "",
      lastLogin: user.lastLogin || "-"
    },
    createdAt: user.createdAt,
    updatedAt: timestamp
  };
}

function profileRecordFromUser(user: AppUser, timestamp: string, lineUserId?: string | null): AppRecord {
  return {
    id: profileRecordId(user.id),
    module: "profile",
    code: "ME",
    title: user.fullName,
    description: user.department,
    status: user.status,
    priority: null,
    category: user.role,
    owner: user.username,
    department: user.department,
    dueDate: null,
    costMonthly: null,
    meta: {
      email: user.email,
      phone: user.phone || "",
      lineUserId: lineUserId || ""
    },
    createdAt: user.createdAt,
    updatedAt: timestamp
  };
}

function settingsRecordFromValue(value: RecordMeta, timestamp: string): AppRecord {
  return {
    id: "settings-record",
    module: "settings",
    code: "SYS-SETTINGS",
    title: String(value.systemName || "ITAM Desk"),
    description: "ตั้งค่าระบบหลัก, SLA, notification และ upload limit",
    status: "active",
    priority: null,
    category: "system",
    owner: "System Administrator",
    department: "IT Department",
    dueDate: null,
    costMonthly: null,
    meta: {
      company: value.companyName || "",
      companyEmail: value.companyEmail || "",
      companyPhone: value.companyPhone || "",
      itemsPerPage: value.itemsPerPage || 20,
      maxUploadMb: value.maxUploadMb || 10,
      lowSla: value.lowSla || 72,
      mediumSla: value.mediumSla || 24,
      highSla: value.highSla || 8,
      criticalSla: value.criticalSla || 2
    },
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function upsertLocalRecord(records: AppRecord[], item: AppRecord) {
  const index = records.findIndex((record) => record.id === item.id);
  if (index === -1) {
    records.unshift(item);
    return;
  }

  records[index] = {
    ...item,
    createdAt: records[index].createdAt
  };
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

export async function createUserAccount(input: UserAccountInput, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const password = input.password.trim();
  const role = input.role || "user";
  const department = input.department || "IT Department";
  const status = normalizeUserStatus(input.status);

  if (!username || !email || !fullName || !password) {
    throw invalidInputError();
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user: AppUser = {
    id: `user-${randomUUID()}`,
    username,
    email,
    passwordHash,
    fullName,
    role,
    department,
    phone: input.phone || null,
    status,
    lastLogin: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const record = userRecordFromUser(user, timestamp, input.code || null);
  const profileRecord = profileRecordFromUser(user, timestamp, "");

  if (hasPostgres()) {
    await ensurePostgres();
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const duplicate = await client.query("SELECT id FROM app_users WHERE LOWER(username) = $1 OR LOWER(email) = $2 LIMIT 1", [username, email]);
      if (duplicate.rows[0]) {
        await client.query("ROLLBACK");
        throw duplicateUserError();
      }

      await client.query(
        `INSERT INTO app_users (id, username, email, password_hash, full_name, role, department, phone, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [user.id, user.username, user.email, user.passwordHash, user.fullName, user.role, user.department, user.phone, user.status, timestamp]
      );
      await insertRecordPostgres(client, record);
      await insertRecordPostgres(client, profileRecord);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } else {
    const db = await readJsonDb();
    const duplicate = db.users.find((item) => item.username.toLowerCase() === username || item.email.toLowerCase() === email);
    if (duplicate) throw duplicateUserError();

    db.users.unshift(user);
    upsertLocalRecord(db.records, record);
    upsertLocalRecord(db.records, profileRecord);
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module: "users",
    action: "create_user",
    recordId: user.id
  });

  return user;
}

export async function updateSystemSettings(input: SystemSettingsInput, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  const current = await getSettings();
  const next: RecordMeta = { ...current };

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") continue;
    next[key] = value;
  }

  const record = settingsRecordFromValue(next, timestamp);

  if (hasPostgres()) {
    await ensurePostgres();
    await getPool().query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ('system', $1::jsonb, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [JSON.stringify(next), timestamp]
    );
    await upsertRecordPostgres(getPool(), record);
  } else {
    const db = await readJsonDb();
    const index = db.settings.findIndex((setting) => setting.key === "system");
    const setting: AppSetting = { key: "system", value: next, updatedAt: timestamp };
    if (index === -1) db.settings.unshift(setting);
    else db.settings[index] = setting;
    upsertLocalRecord(db.records, record);
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module: "settings",
    action: "update_settings",
    recordId: "system"
  });
}

export async function updateCurrentUserProfile(userId: string, input: ProfileInput, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName || !email) {
    throw invalidInputError();
  }

  const passwordHash = input.password?.trim() ? await bcrypt.hash(input.password.trim(), 10) : null;
  let updatedUser: AppUser | null = null;

  if (hasPostgres()) {
    await ensurePostgres();
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const duplicate = await client.query("SELECT id FROM app_users WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1", [email, userId]);
      if (duplicate.rows[0]) {
        await client.query("ROLLBACK");
        throw duplicateUserError();
      }

      const result = await client.query(
        `UPDATE app_users
         SET full_name = $1,
             email = $2,
             phone = $3,
             password_hash = COALESCE($4, password_hash),
             updated_at = $5
         WHERE id = $6
         RETURNING *`,
        [fullName, email, input.phone || null, passwordHash, timestamp, userId]
      );
      updatedUser = result.rows[0] ? rowToUser(result.rows[0]) : null;
      if (!updatedUser) throw invalidInputError();

      const existingUserRecord = await client.query("SELECT code FROM app_records WHERE id = $1 LIMIT 1", [userRecordId(userId)]);
      await upsertRecordPostgres(client, userRecordFromUser(updatedUser, timestamp, existingUserRecord.rows[0]?.code ? String(existingUserRecord.rows[0].code) : undefined));
      await upsertRecordPostgres(client, profileRecordFromUser(updatedUser, timestamp, input.lineUserId || null));
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  } else {
    const db = await readJsonDb();
    const duplicate = db.users.find((item) => item.email.toLowerCase() === email && item.id !== userId);
    if (duplicate) throw duplicateUserError();

    db.users = db.users.map((user) => {
      if (user.id !== userId) return user;
      updatedUser = {
        ...user,
        fullName,
        email,
        phone: input.phone || null,
        passwordHash: passwordHash || user.passwordHash,
        updatedAt: timestamp
      };
      return updatedUser;
    });

    if (!updatedUser) throw invalidInputError();

    const existingUserRecord = db.records.find((record) => record.id === userRecordId(userId));
    upsertLocalRecord(db.records, userRecordFromUser(updatedUser, timestamp, existingUserRecord?.code));
    upsertLocalRecord(db.records, profileRecordFromUser(updatedUser, timestamp, input.lineUserId || null));
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module: "profile",
    action: "update_profile",
    recordId: userId
  });
}

export async function updateRecordStatus(id: string, status: string, actor?: AppUser | null) {
  const timestamp = new Date().toISOString();
  let module = "records";
  let owner: string | null = null;
  let nextStatus = status;

  if (hasPostgres()) {
    await ensurePostgres();
    const current = await getPool().query("SELECT module, owner FROM app_records WHERE id = $1", [id]);
    module = current.rows[0]?.module || module;
    owner = current.rows[0]?.owner ? String(current.rows[0].owner) : null;
    nextStatus = module === "users" ? normalizeUserStatus(status) : status;
    await getPool().query("UPDATE app_records SET status = $1, updated_at = $2 WHERE id = $3", [nextStatus, timestamp, id]);
    if (module === "users" && owner) {
      await getPool().query("UPDATE app_users SET status = $1, updated_at = $2 WHERE LOWER(username) = $3", [nextStatus, timestamp, owner.toLowerCase()]);
    }
  } else {
    const db = await readJsonDb();
    db.records = db.records.map((record) => {
      if (record.id !== id) return record;
      module = record.module;
      owner = record.owner || null;
      nextStatus = module === "users" ? normalizeUserStatus(status) : status;
      return { ...record, status: nextStatus, updatedAt: timestamp };
    });
    if (module === "users" && owner) {
      db.users = db.users.map((user) => (user.username.toLowerCase() === owner!.toLowerCase() ? { ...user, status: nextStatus, updatedAt: timestamp } : user));
    }
    await writeJsonDb(db);
  }

  await addAuditLog({
    actor,
    module,
    action: `update_status:${nextStatus}`,
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

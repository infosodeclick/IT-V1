"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, requireUser, setSession } from "@/lib/auth";
import {
  countRecords,
  createRecord,
  createUserAccount,
  getUserByUsername,
  touchLastLogin,
  updateCurrentUserProfile,
  updateRecordStatus,
  updateSystemSettings
} from "@/lib/db";
import { getModuleByPath } from "@/lib/definitions";
import type { FieldDefinition, ModuleDefinition, RecordMeta } from "@/lib/types";

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function actionErrorCode(error: unknown) {
  if (error instanceof Error && error.message === "DUPLICATE_USER") return "duplicate";
  return "required";
}

function codeFor(module: ModuleDefinition, nextCount: number) {
  const prefix = module.codePrefix || module.id.toUpperCase();
  const buddhistYear = new Date().getFullYear() + 543;
  return `${prefix}-${buddhistYear}-${String(nextCount).padStart(5, "0")}`;
}

function targetPath(module: ModuleDefinition) {
  if (module.path.endsWith("/new")) return module.path.replace(/\/new$/, "");
  return module.path;
}

function mapField(field: FieldDefinition, formData: FormData, meta: RecordMeta) {
  if (field.type === "checkbox") {
    const checked = formData.get(field.name) === "on";
    if (field.target === "meta" || !field.target) meta[field.name] = checked;
    return checked;
  }

  const raw = stringValue(formData, field.name);
  if (field.type === "number") return numberValue(raw);
  if (field.name.toLowerCase().includes("password") && raw) return "••••••••";
  return raw;
}

export async function loginAction(formData: FormData) {
  const login = stringValue(formData, "login");
  const password = stringValue(formData, "password");
  const user = await getUserByUsername(login);

  if (!user || user.status !== "active") {
    redirect("/login?error=invalid");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    redirect("/login?error=invalid");
  }

  await touchLastLogin(user.id);
  await setSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createRecordAction(modulePath: string, formData: FormData) {
  const actor = await requireUser();
  const module = getModuleByPath(modulePath);
  if (!module) redirect("/dashboard");
  const path = targetPath(module);

  if (module.id === "users") {
    const fullName = stringValue(formData, "title");
    const username = stringValue(formData, "owner");
    const email = stringValue(formData, "email");
    const password = stringValue(formData, "password");

    if (!fullName || !username || !email || !password) {
      redirect(`${path}?error=required`);
    }

    const nextCount = (await countRecords(module.id)) + 1;
    try {
      await createUserAccount(
        {
          code: codeFor(module, nextCount),
          fullName,
          username,
          email,
          password,
          role: stringValue(formData, "category") || "user",
          department: stringValue(formData, "department") || actor.department,
          phone: stringValue(formData, "phone") || null,
          status: module.defaultStatus || "active"
        },
        actor
      );
    } catch (error) {
      redirect(`${path}?error=${actionErrorCode(error)}`);
    }

    revalidatePath(path);
    revalidatePath("/dashboard");
    redirect(`${path}?created=1`);
  }

  if (module.special === "settings") {
    try {
      await updateSystemSettings(
        {
          systemName: stringValue(formData, "title"),
          companyName: stringValue(formData, "company"),
          companyEmail: stringValue(formData, "companyEmail"),
          companyPhone: stringValue(formData, "companyPhone"),
          lowSla: numberValue(stringValue(formData, "lowSla")),
          mediumSla: numberValue(stringValue(formData, "mediumSla")),
          highSla: numberValue(stringValue(formData, "highSla")),
          criticalSla: numberValue(stringValue(formData, "criticalSla")),
          itemsPerPage: numberValue(stringValue(formData, "itemsPerPage")),
          maxUploadMb: numberValue(stringValue(formData, "maxUploadMb"))
        },
        actor
      );
    } catch (error) {
      redirect(`${path}?error=${actionErrorCode(error)}`);
    }

    revalidatePath(path);
    revalidatePath("/dashboard");
    redirect(`${path}?created=1`);
  }

  if (module.special === "profile") {
    const fullName = stringValue(formData, "title");
    const email = stringValue(formData, "email");

    if (!fullName || !email) {
      redirect(`${path}?error=required`);
    }

    try {
      await updateCurrentUserProfile(
        actor.id,
        {
          fullName,
          email,
          phone: stringValue(formData, "phone") || null,
          lineUserId: stringValue(formData, "lineUserId") || null,
          password: stringValue(formData, "password") || null
        },
        actor
      );
    } catch (error) {
      redirect(`${path}?error=${actionErrorCode(error)}`);
    }

    revalidatePath(path);
    revalidatePath("/dashboard");
    redirect(`${path}?created=1`);
  }

  const meta: RecordMeta = {};
  const input = {
    module: module.id,
    title: "",
    description: null as string | null,
    status: module.defaultStatus || "เปิด",
    priority: null as string | null,
    category: null as string | null,
    owner: actor.fullName,
    department: actor.department,
    dueDate: null as string | null,
    costMonthly: null as number | null,
    meta
  };

  for (const field of module.createFields || []) {
    const value = mapField(field, formData, meta);

    if (field.required && (value === "" || value == null || value === false)) {
      redirect(`${module.path}?error=required`);
    }

    switch (field.target) {
      case "title":
        input.title = String(value || "");
        break;
      case "description":
        input.description = String(value || "");
        break;
      case "status":
        input.status = String(value || module.defaultStatus || "เปิด");
        break;
      case "priority":
        input.priority = String(value || "");
        break;
      case "category":
        input.category = String(value || "");
        break;
      case "owner":
        input.owner = String(value || actor.fullName);
        break;
      case "department":
        input.department = String(value || actor.department);
        break;
      case "dueDate":
        input.dueDate = String(value || "");
        break;
      case "costMonthly":
        input.costMonthly = typeof value === "number" ? value : numberValue(String(value || ""));
        break;
      default:
        if (field.name && value !== "" && value != null) meta[field.name] = value;
    }
  }

  if (!input.title) {
    input.title = `${module.title} ${new Date().toLocaleDateString("th-TH")}`;
  }

  const nextCount = (await countRecords(module.id)) + 1;
  await createRecord(
    {
      ...input,
      code: module.codePrefix ? codeFor(module, nextCount) : null
    },
    actor
  );

  revalidatePath(path);
  revalidatePath("/dashboard");
  redirect(`${path}?created=1`);
}

export async function updateStatusAction(recordId: string, status: string, path: string) {
  const actor = await requireUser();
  await updateRecordStatus(recordId, status, actor);
  revalidatePath(path);
  revalidatePath("/dashboard");
}

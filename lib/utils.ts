import type { AppRecord, RecordMeta } from "@/lib/types";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(value);
}

export function buddhistToday() {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

export function getMeta(meta: RecordMeta, key: string) {
  const value = meta[key];
  if (Array.isArray(value)) return value.join(", ");
  return value ?? "";
}

export function valueFor(record: AppRecord, key: string) {
  if (key.startsWith("meta.")) return getMeta(record.meta, key.replace("meta.", ""));
  return record[key as keyof AppRecord] ?? "";
}

export function statusTone(status?: string | null) {
  const value = (status || "").toLowerCase();
  if (["ปิด", "แก้แล้ว", "อนุมัติแล้ว", "ใช้งาน", "published", "active"].some((item) => value.includes(item))) {
    return "good";
  }
  if (["เปิด", "รอ", "ครบกำหนด", "กำลัง"].some((item) => value.includes(item))) {
    return "warn";
  }
  if (["restricted", "ใกล้หมด", "สูง", "critical"].some((item) => value.includes(item))) {
    return "risk";
  }
  return "neutral";
}

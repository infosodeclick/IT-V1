import { Check, Download, Plus, RotateCcw, Save, Search, X } from "lucide-react";
import Link from "next/link";

import { createRecordAction, updateStatusAction } from "@/app/actions";
import type { AppRecord, FieldDefinition, ModuleDefinition } from "@/lib/types";
import { cx, formatDate, formatMoney, statusTone, valueFor } from "@/lib/utils";

function cleanDisplay(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "ใช่" : "ไม่";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function fieldControl(field: FieldDefinition) {
  const common = {
    id: field.name,
    name: field.name,
    required: field.required,
    placeholder: field.placeholder
  };

  if (field.type === "textarea") {
    return <textarea {...common} rows={4} />;
  }

  if (field.type === "select") {
    return (
      <select id={field.name} name={field.name} required={field.required} defaultValue="">
        <option value="" disabled={field.required}>
          เลือก
        </option>
        {(field.options || []).map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="checkbox-line">
        <input type="checkbox" name={field.name} />
        <span>{field.placeholder || field.label}</span>
      </label>
    );
  }

  return <input {...common} type={field.type} />;
}

function renderValue(record: AppRecord, key: string, tone?: string) {
  const value = valueFor(record, key);
  if (tone === "date") return formatDate(cleanDisplay(value));
  if (tone === "money") return formatMoney(typeof value === "number" ? value : Number(value));
  if (tone === "status") return <span className={`status ${statusTone(cleanDisplay(value))}`}>{cleanDisplay(value)}</span>;
  return cleanDisplay(value);
}

function nextStatusFor(module: ModuleDefinition, record: AppRecord) {
  const status = record.status || "";
  if (module.id === "checkout") return status === "ยืมอยู่" ? "คืนแล้ว" : "ยืมอยู่";
  if (module.id === "pm-calendar") return "ทำแล้ว";
  if (module.id.includes("request") || status.includes("รอ")) return "อนุมัติแล้ว";
  if (status === "เปิด") return "กำลังดำเนินการ";
  if (status === "กำลังดำเนินการ") return "แก้แล้ว";
  return "ปิด";
}

function SummaryStrip({ records }: { records: AppRecord[] }) {
  const active = records.filter((item) => ["เปิด", "กำลังดำเนินการ", "รออนุมัติ", "รอจัดสรร", "ยืมอยู่", "ครบกำหนด"].includes(item.status || "")).length;
  const done = records.filter((item) => ["ปิด", "แก้แล้ว", "อนุมัติแล้ว", "คืนแล้ว", "ทำแล้ว", "ใช้งาน", "published", "active"].includes(item.status || "")).length;
  const monthly = records.reduce((sum, item) => sum + (item.costMonthly || 0), 0);

  return (
    <section className="summary-strip">
      <div>
        <small>ทั้งหมด</small>
        <strong>{records.length}</strong>
      </div>
      <div>
        <small>กำลังติดตาม</small>
        <strong>{active}</strong>
      </div>
      <div>
        <small>สำเร็จ/ใช้งาน</small>
        <strong>{done}</strong>
      </div>
      <div>
        <small>ค่าใช้จ่าย/เดือน</small>
        <strong>{formatMoney(monthly)}</strong>
      </div>
    </section>
  );
}

function FilterBar({ module }: { module: ModuleDefinition }) {
  if (!module.filters?.length) return null;

  return (
    <form className="filter-bar">
      {module.filters.map((field) => (
        <label key={field.name}>
          <span>{field.label}</span>
          {fieldControl(field)}
        </label>
      ))}
      <button className="button primary" type="submit">
        <Search size={16} aria-hidden="true" />
        ค้นหา
      </button>
      <Link className="button ghost" href={module.path}>
        <RotateCcw size={16} aria-hidden="true" />
        ล้าง
      </Link>
    </form>
  );
}

function CreateForm({ module }: { module: ModuleDefinition }) {
  if (!module.createFields?.length) return null;
  const action = createRecordAction.bind(null, module.path);

  return (
    <section className="panel form-panel" id="create">
      <div className="panel-head">
        <div>
          <h2>{module.createTitle || module.primaryAction || `เพิ่ม ${module.title}`}</h2>
          <p>กรอกข้อมูลให้ครบ ระบบจะสร้างเลขอ้างอิงและบันทึก audit log ให้เอง</p>
        </div>
      </div>
      <form className="record-form" action={action}>
        {module.createFields.map((field) => (
          <label className={field.type === "textarea" ? "span-2" : ""} key={field.name}>
            <span>{field.label}</span>
            {fieldControl(field)}
          </label>
        ))}
        <div className="form-actions span-2">
          <Link className="button ghost" href={module.path.endsWith("/new") ? module.path.replace(/\/new$/, "") : module.path}>
            <X size={16} aria-hidden="true" />
            ยกเลิก
          </Link>
          <button className="button primary" type="submit">
            <Save size={16} aria-hidden="true" />
            บันทึก
          </button>
        </div>
      </form>
    </section>
  );
}

function RecordsTable({ module, records }: { module: ModuleDefinition; records: AppRecord[] }) {
  if (!module.columns?.length) return null;

  return (
    <section className="panel table-panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {module.columns.map((column) => (
                <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                  {column.label}
                </th>
              ))}
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {records.length ? (
              records.map((record) => {
                const nextStatus = nextStatusFor(module, record);
                return (
                  <tr key={record.id}>
                    {module.columns!.map((column) => (
                      <td className={cx(column.tone === "strong" && "strong", column.tone === "muted" && "muted")} key={column.key}>
                        {renderValue(record, column.key, column.tone)}
                      </td>
                    ))}
                    <td className="row-actions">
                      <form action={updateStatusAction.bind(null, record.id, nextStatus, module.path)}>
                        <button className="mini-action" type="submit" title={`เปลี่ยนเป็น ${nextStatus}`}>
                          <Check size={14} aria-hidden="true" />
                        </button>
                      </form>
                      <form action={updateStatusAction.bind(null, record.id, "ปิด", module.path)}>
                        <button className="mini-action danger" type="submit" title="ปิดรายการ">
                          <X size={14} aria-hidden="true" />
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={(module.columns?.length || 0) + 1}>
                  <div className="empty-table">
                    <strong>{module.emptyTitle || "ยังไม่มีข้อมูล"}</strong>
                    <span>{module.emptyBody || "เพิ่มรายการใหม่หรือปรับตัวกรองการค้นหา"}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalendarView({ records }: { records: AppRecord[] }) {
  const dated = records
    .filter((record) => record.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
    .slice(0, 12);

  return (
    <section className="panel calendar-panel">
      <div className="calendar-grid">
        {dated.map((record) => (
          <article className="calendar-event" key={record.id}>
            <time>{formatDate(record.dueDate)}</time>
            <strong>{record.title}</strong>
            <span>{record.module} · {record.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function QrView({ records }: { records: AppRecord[] }) {
  return (
    <section className="qr-layout">
      <article className="panel scanner-panel">
        <div className="scanner-frame">
          <span>QR</span>
          <i />
        </div>
        <div className="scanner-actions">
          <button className="button primary" type="button">เปิดกล้อง</button>
          <button className="button ghost" type="button">หยุด</button>
        </div>
        <label className="manual-scan">
          <span>ค้นหา Asset Tag</span>
          <input placeholder="เช่น IT-2569-00001" />
        </label>
      </article>
      <article className="panel">
        <div className="panel-head">
          <h2>ผลลัพธ์ล่าสุด</h2>
        </div>
        <div className="asset-card-list">
          {records.slice(0, 5).map((asset) => (
            <div className="asset-mini" key={asset.id}>
              <strong>{asset.code}</strong>
              <span>{asset.title}</span>
              <small>{asset.owner} · {asset.status}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function ReportsView({ records }: { records: AppRecord[] }) {
  const modules = ["assets", "tickets", "licenses", "subscriptions", "vendors"];
  return (
    <section className="report-grid">
      {modules.map((module) => {
        const count = records.filter((record) => record.module === module).length;
        return (
          <article className="panel report-card" key={module}>
            <span className="report-icon">📥</span>
            <strong>{module}</strong>
            <small>{count} รายการพร้อมส่งออก</small>
            <a className="button ghost" href={`/api/reports/${module}`}>
              <Download size={16} aria-hidden="true" />
              CSV
            </a>
          </article>
        );
      })}
    </section>
  );
}

export function ModulePage({
  module,
  records,
  created,
  error
}: {
  module: ModuleDefinition;
  records: AppRecord[];
  created?: boolean;
  error?: string;
}) {
  const showOnlyForm = module.path.endsWith("/new");

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>
            <span>{module.icon}</span>
            {module.title}
          </h1>
          <p>{module.subtitle}</p>
        </div>
        {module.primaryAction ? (
          <a className="button primary" href="#create">
            <Plus size={16} aria-hidden="true" />
            {module.primaryAction}
          </a>
        ) : null}
      </div>

      {created ? <div className="notice good">บันทึกข้อมูลเรียบร้อยแล้ว</div> : null}
      {error ? <div className="notice bad">กรุณากรอกข้อมูลที่จำเป็นให้ครบ</div> : null}

      {module.special === "calendar" ? <CalendarView records={records} /> : null}
      {module.special === "qr" ? <QrView records={records} /> : null}
      {module.special === "reports" ? <ReportsView records={records} /> : null}

      {!showOnlyForm && !module.special ? <SummaryStrip records={records} /> : null}
      {!showOnlyForm ? <FilterBar module={module} /> : null}
      {!showOnlyForm && !module.special ? <RecordsTable module={module} records={records} /> : null}
      <CreateForm module={module} />
    </div>
  );
}

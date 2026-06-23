import { NextResponse } from "next/server";

import { listRecords } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const records = await listRecords(module);
  const rows = [
    ["code", "title", "status", "priority", "category", "owner", "department", "dueDate", "costMonthly", "meta"],
    ...records.map((record) => [
      record.code || "",
      record.title,
      record.status || "",
      record.priority || "",
      record.category || "",
      record.owner || "",
      record.department || "",
      record.dueDate || "",
      record.costMonthly || "",
      JSON.stringify(record.meta)
    ])
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${module}-report.csv"`
    }
  });
}

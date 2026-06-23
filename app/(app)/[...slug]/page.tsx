import { notFound } from "next/navigation";

import { ModulePage } from "@/components/ModulePage";
import { requireUser } from "@/lib/auth";
import { listAllRecords, listRecords } from "@/lib/db";
import { getModuleFromSlug } from "@/lib/definitions";
import type { AppRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DynamicModulePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const module = getModuleFromSlug(slug);

  if (!module) notFound();

  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    filters[key] = Array.isArray(value) ? value[0] : value;
  }

  let records: AppRecord[];
  if (module.special === "calendar" || module.special === "reports") {
    records = await listAllRecords();
  } else if (module.special === "qr") {
    records = await listRecords("assets", filters);
  } else if (module.special === "profile") {
    const user = await requireUser();
    const profileRecords = await listRecords("profile", filters);
    const profile = profileRecords.find((record) => record.owner?.toLowerCase() === user.username.toLowerCase());
    records = [
      profile || {
        id: `profile-record-${user.id}`,
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
          lineUserId: ""
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    ];
  } else {
    records = await listRecords(module.id, filters);
  }

  return <ModulePage module={module} records={records} created={query.created === "1"} error={typeof query.error === "string" ? query.error : undefined} />;
}

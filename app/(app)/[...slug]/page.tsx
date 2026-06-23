import { notFound } from "next/navigation";

import { ModulePage } from "@/components/ModulePage";
import { listAllRecords, listRecords } from "@/lib/db";
import { getModuleFromSlug } from "@/lib/definitions";

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

  const records =
    module.special === "calendar" || module.special === "reports"
      ? await listAllRecords()
      : module.special === "qr"
        ? await listRecords("assets", filters)
        : await listRecords(module.id, filters);

  return <ModulePage module={module} records={records} created={query.created === "1"} error={typeof query.error === "string" ? query.error : undefined} />;
}

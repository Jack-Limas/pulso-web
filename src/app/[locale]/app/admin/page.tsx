import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/admin/admin-console";
import { Role } from "@/gen/pulso/v1/auth_service_pb";
import { privateClients } from "@/lib/api/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export const dynamic = "force-dynamic";

// The role is checked on the server; the API enforces it again on every admin call.
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const { user } = await (await privateClients(locale)).auth.getCurrentUser({});
  if (user?.role !== Role.ADMIN) {
    notFound();
  }
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">{getDictionary(locale).app.admin.title}</h1>
      <AdminConsole />
    </div>
  );
}

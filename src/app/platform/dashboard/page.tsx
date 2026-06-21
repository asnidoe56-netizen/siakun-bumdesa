import { db } from "@/lib/db/pool";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { ResponsiveGrid } from "@/components/layouts/responsive-grid";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

async function getDashboardData() {
  const [
    bumdesaCount,
    userCount,
    templateCount,
    registrationStats,
    latestRegistrations,
  ] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS total FROM bum_desa WHERE is_active = TRUE"),
    db.query("SELECT COUNT(*)::int AS total FROM app_user WHERE is_active = TRUE"),
    db.query("SELECT COUNT(*)::int AS total FROM template_transaksi WHERE status = 'ACTIVE'"),
    db.query(`
      SELECT status, COUNT(*)::int AS total
      FROM bum_desa_registration
      GROUP BY status
    `),
    db.query(`
      SELECT kode_pendaftaran, nama_bum_desa, nama_pendaftar, status, created_at
      FROM bum_desa_registration
      ORDER BY created_at DESC
      LIMIT 5
    `),
  ]);

  const stats = new Map<string, number>(
    registrationStats.rows.map((row) => [row.status, row.total])
  );

  return {
    totalBumdesa: bumdesaCount.rows[0]?.total ?? 0,
    totalUsers: userCount.rows[0]?.total ?? 0,
    totalTemplates: templateCount.rows[0]?.total ?? 0,
    pendingRegistrations: stats.get("PENDING") ?? 0,
    approvedRegistrations: stats.get("APPROVED") ?? 0,
    rejectedRegistrations: stats.get("REJECTED") ?? 0,
    latestRegistrations: latestRegistrations.rows,
  };
}

export default async function PlatformDashboardPage() {
  const data = await getDashboardData();

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard Super Admin"
        description="Ringkasan platform SiAkun BUM Desa, pendaftaran BUMDes, pengguna, dan template transaksi global."
      />

      <div className="mt-6 space-y-6">
        <ResponsiveGrid columns={4}>
          <KpiCard
            title="BUMDes Aktif"
            value={data.totalBumdesa}
            description="BUMDes yang sudah aktif di platform."
          />
          <KpiCard
            title="Menunggu Review"
            value={data.pendingRegistrations}
            description="Pendaftaran BUMDes yang perlu ditinjau."
          />
          <KpiCard
            title="Pengguna Aktif"
            value={data.totalUsers}
            description="Seluruh akun pengguna aktif."
          />
          <KpiCard
            title="Template Aktif"
            value={data.totalTemplates}
            description="Template transaksi global tersedia."
          />
        </ResponsiveGrid>

        <Card>
          <CardHeader>
            <CardTitle>Pendaftaran Terbaru</CardTitle>
            <CardDescription>
              Data ini langsung dibaca dari database pendaftaran BUMDes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.latestRegistrations.length > 0 ? (
              <div className="space-y-3">
                {data.latestRegistrations.map((item) => (
                  <div
                    key={item.kode_pendaftaran}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.nama_bum_desa}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.kode_pendaftaran} � {item.nama_pendaftar}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Belum ada pendaftaran BUMDes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

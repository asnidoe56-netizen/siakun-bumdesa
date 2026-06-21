import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getBumDesaRegistrationDetail } from "@/lib/platform/get-bum-desa-registration-detail";
import {
  approveBumDesaRegistration,
  rejectBumDesaRegistration,
} from "@/app/platform/registrations/actions";

type RegistrationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

const detailPageStyles = {
  content: "mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]",
  stack: "space-y-6",
  section: "grid gap-4 sm:grid-cols-2",
  field: "rounded-xl border border-slate-200 bg-slate-50 p-4",
  label: "text-xs font-medium uppercase tracking-wide text-slate-400",
  value: "mt-1 text-sm font-medium text-slate-900",
  mutedValue: "mt-1 text-sm text-slate-500",
  actionArea: "flex flex-col gap-3 sm:flex-row",
  actionButton: {
    base: "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    approve: "bg-slate-900 text-white hover:bg-slate-800",
    reject: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    back: "inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50",
  },
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className={detailPageStyles.field}>
      <p className={detailPageStyles.label}>{label}</p>
      <p className={value ? detailPageStyles.value : detailPageStyles.mutedValue}>
        {value || "-"}
      </p>
    </div>
  );
}

export default async function RegistrationDetailPage({
  params,
}: RegistrationDetailPageProps) {
  const { id } = await params;
  const registration = await getBumDesaRegistrationDetail(id);

  if (!registration) {
    notFound();
  }

  const canReview = registration.status === "PENDING";

  return (
    <PageContainer>
      <PageHeader
        title={registration.nama_bum_desa}
        description={`Detail pendaftaran ${registration.kode_pendaftaran}. Data ini dibaca langsung dari database.`}
      />

      <div className={detailPageStyles.content}>
        <div className={detailPageStyles.stack}>
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pendaftaran</CardTitle>
              <CardDescription>
                Data identitas BUMDes dan pendaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={detailPageStyles.section}>
                <DetailField label="Kode Pendaftaran" value={registration.kode_pendaftaran} />
                <DetailField label="Status" value={registration.status} />
                <DetailField label="Nama BUMDes" value={registration.nama_bum_desa} />
                <DetailField label="NIB" value={registration.nib} />
                <DetailField label="Nama Pendaftar" value={registration.nama_pendaftar} />
                <DetailField label="Jabatan" value={registration.jabatan_pendaftar} />
                <DetailField label="Email" value={registration.email_pendaftar} />
                <DetailField label="Nomor HP" value={registration.nomor_hp_pendaftar} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wilayah</CardTitle>
              <CardDescription>
                Lokasi BUMDes sesuai data pendaftaran.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={detailPageStyles.section}>
                <DetailField label="Alamat" value={registration.alamat} />
                <DetailField label="Desa" value={registration.desa} />
                <DetailField label="Kecamatan" value={registration.kecamatan} />
                <DetailField label="Kabupaten" value={registration.kabupaten} />
                <DetailField label="Provinsi" value={registration.provinsi} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={detailPageStyles.stack}>
          <Card>
            <CardHeader>
              <CardTitle>Status Review</CardTitle>
              <CardDescription>
                Keputusan Super Admin terhadap pendaftaran ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={detailPageStyles.stack}>
                <StatusBadge status={registration.status} />

                <DetailField label="Tanggal Daftar" value={formatDate(registration.created_at)} />
                <DetailField label="Tanggal Review" value={formatDate(registration.reviewed_at)} />
                <DetailField label="Catatan Review" value={registration.catatan_review} />

                {registration.approved_bum_desa_id ? (
                  <>
                    <DetailField
                      label="BUMDes Aktif"
                      value={registration.approved_bum_desa_nama}
                    />
                    <DetailField
                      label="Kode BUMDes"
                      value={registration.approved_bum_desa_kode}
                    />
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
              <CardDescription>
                Aksi hanya tersedia jika status masih menunggu review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canReview ? (
                <div className={detailPageStyles.actionArea}>
                  <form action={approveBumDesaRegistration}>
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <button
                      type="submit"
                      className={`${detailPageStyles.actionButton.base} ${detailPageStyles.actionButton.approve}`}
                    >
                      Terima
                    </button>
                  </form>

                  <form action={rejectBumDesaRegistration}>
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <input
                      type="hidden"
                      name="catatanReview"
                      value="Pendaftaran ditolak oleh Super Admin."
                    />
                    <button
                      type="submit"
                      className={`${detailPageStyles.actionButton.base} ${detailPageStyles.actionButton.reject}`}
                    >
                      Tolak
                    </button>
                  </form>
                </div>
              ) : (
                <p className={detailPageStyles.mutedValue}>
                  Pendaftaran ini sudah direview dan tidak dapat diproses ulang.
                </p>
              )}
            </CardContent>
          </Card>

          <Link
            href="/platform/registrations"
            className={detailPageStyles.actionButton.back}
          >
            Kembali ke daftar
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
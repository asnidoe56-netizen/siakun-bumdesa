import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { BumDesaRegistrationRow } from "@/lib/platform/get-bum-desa-registrations";
import {
  approveBumDesaRegistration,
  rejectBumDesaRegistration,
} from "@/app/platform/registrations/actions";

type RegistrationListProps = {
  registrations: BumDesaRegistrationRow[];
};

const registrationListStyles = {
  root: "space-y-3",
  mobileList: "space-y-3 lg:hidden",
  desktopList: "hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block",
  desktopHeader: "grid grid-cols-[1fr_1.25fr_1fr_1.15fr_0.85fr_1fr] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
  desktopRow: "grid grid-cols-[1fr_1.25fr_1fr_1.15fr_0.85fr_1fr] gap-4 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50",
  card: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
  cardHeader: "flex items-start justify-between gap-3",
  primaryText: "font-semibold text-slate-950",
  secondaryText: "mt-1 text-sm text-slate-500",
  mutedText: "text-sm text-slate-500",
  code: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaGrid: "mt-4 grid gap-3 text-sm sm:grid-cols-2",
  metaLabel: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaValue: "mt-1 text-slate-700",
  detailLink: "inline-flex text-sm font-medium text-slate-950 hover:underline",
  mobileActionArea: "mt-4 flex flex-col gap-2 sm:flex-row sm:items-center",
  desktopActionArea: "flex flex-col gap-2",
  actionButton: {
    base: "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    approve: "bg-slate-900 text-white hover:bg-slate-800",
    reject: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    muted: "border border-slate-200 bg-slate-50 text-slate-500",
  },
  empty: "rounded-2xl border border-dashed border-slate-300 bg-white p-6",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRegion(registration: BumDesaRegistrationRow) {
  return [
    registration.desa,
    registration.kecamatan,
    registration.kabupaten,
    registration.provinsi,
  ]
    .filter(Boolean)
    .join(", ");
}

function RegistrationActions({
  registration,
  mode,
}: {
  registration: BumDesaRegistrationRow;
  mode: "mobile" | "desktop";
}) {
  if (registration.status !== "PENDING") {
    return (
      <div
        className={
          mode === "mobile"
            ? registrationListStyles.mobileActionArea
            : registrationListStyles.desktopActionArea
        }
      >
        <Link
          href={`/platform/registrations/${registration.id}`}
          className={registrationListStyles.detailLink}
        >
          Lihat detail
        </Link>
      </div>
    );
  }

  return (
    <div
      className={
        mode === "mobile"
          ? registrationListStyles.mobileActionArea
          : registrationListStyles.desktopActionArea
      }
    >
      <form action={approveBumDesaRegistration}>
        <input type="hidden" name="registrationId" value={registration.id} />
        <button
          type="submit"
          className={`${registrationListStyles.actionButton.base} ${registrationListStyles.actionButton.approve}`}
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
          className={`${registrationListStyles.actionButton.base} ${registrationListStyles.actionButton.reject}`}
        >
          Tolak
        </button>
      </form>

      <Link
        href={`/platform/registrations/${registration.id}`}
        className={registrationListStyles.detailLink}
      >
        Detail
      </Link>
    </div>
  );
}

export function RegistrationList({ registrations }: RegistrationListProps) {
  if (registrations.length === 0) {
    return (
      <div className={registrationListStyles.empty}>
        <EmptyState
          title="Belum ada pendaftaran BUMDes"
          description="Data pendaftaran yang masuk akan tampil di halaman ini."
        />
      </div>
    );
  }

  return (
    <div className={registrationListStyles.root}>
      <div className={registrationListStyles.mobileList}>
        {registrations.map((registration) => (
          <article key={registration.id} className={registrationListStyles.card}>
            <div className={registrationListStyles.cardHeader}>
              <div>
                <p className={registrationListStyles.code}>
                  {registration.kode_pendaftaran}
                </p>
                <h2 className={registrationListStyles.primaryText}>
                  {registration.nama_bum_desa}
                </h2>
                <p className={registrationListStyles.secondaryText}>
                  {registration.nama_pendaftar}
                </p>
              </div>

              <StatusBadge status={registration.status} />
            </div>

            <div className={registrationListStyles.metaGrid}>
              <div>
                <p className={registrationListStyles.metaLabel}>Email</p>
                <p className={registrationListStyles.metaValue}>
                  {registration.email_pendaftar}
                </p>
              </div>

              <div>
                <p className={registrationListStyles.metaLabel}>Wilayah</p>
                <p className={registrationListStyles.metaValue}>
                  {formatRegion(registration) || "-"}
                </p>
              </div>

              <div>
                <p className={registrationListStyles.metaLabel}>Tanggal Daftar</p>
                <p className={registrationListStyles.metaValue}>
                  {formatDate(registration.created_at)}
                </p>
              </div>

              <div>
                <p className={registrationListStyles.metaLabel}>Jabatan</p>
                <p className={registrationListStyles.metaValue}>
                  {registration.jabatan_pendaftar || "-"}
                </p>
              </div>
            </div>

            <RegistrationActions registration={registration} mode="mobile" />
          </article>
        ))}
      </div>

      <div className={registrationListStyles.desktopList}>
        <div className={registrationListStyles.desktopHeader}>
          <span>Kode</span>
          <span>BUMDes</span>
          <span>Pendaftar</span>
          <span>Wilayah</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>

        {registrations.map((registration) => (
          <div key={registration.id} className={registrationListStyles.desktopRow}>
            <div>
              <p className={registrationListStyles.primaryText}>
                {registration.kode_pendaftaran}
              </p>
              <p className={registrationListStyles.secondaryText}>
                {formatDate(registration.created_at)}
              </p>
            </div>

            <div>
              <Link
                href={`/platform/registrations/${registration.id}`}
                className={registrationListStyles.detailLink}
              >
                {registration.nama_bum_desa}
              </Link>
              <p className={registrationListStyles.secondaryText}>
                {registration.email_pendaftar}
              </p>
            </div>

            <div>
              <p className={registrationListStyles.primaryText}>
                {registration.nama_pendaftar}
              </p>
              <p className={registrationListStyles.secondaryText}>
                {registration.jabatan_pendaftar || "-"}
              </p>
            </div>

            <p className={registrationListStyles.mutedText}>
              {formatRegion(registration) || "-"}
            </p>

            <StatusBadge status={registration.status} />

            <RegistrationActions registration={registration} mode="desktop" />
          </div>
        ))}
      </div>
    </div>
  );
}

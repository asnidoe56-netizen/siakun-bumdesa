import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { PlatformBumDesaRow } from "@/lib/platform/get-platform-bum-desa-list";
import {
  activateBumDesa,
  deleteBumDesa,
  suspendBumDesa,
} from "@/app/platform/bumdes/actions";

type BumDesaListProps = {
  bumDesa: PlatformBumDesaRow[];
};

const bumDesaListStyles = {
  root: "space-y-3",
  mobileList: "space-y-3 lg:hidden",
  desktopList: "hidden overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block",
  desktopHeader: "grid grid-cols-[0.4fr_1fr_1.4fr_1.3fr_0.8fr_1.1fr] gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
  desktopRow: "grid grid-cols-[0.4fr_1fr_1.4fr_1.3fr_0.8fr_1.1fr] gap-4 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 hover:bg-slate-50",
  card: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
  cardHeader: "flex items-start justify-between gap-3",
  number: "text-sm font-semibold text-slate-400",
  primaryText: "font-semibold text-slate-950",
  secondaryText: "mt-1 text-sm text-slate-500",
  mutedText: "text-sm text-slate-500",
  code: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaGrid: "mt-4 grid gap-3 text-sm sm:grid-cols-2",
  metaLabel: "text-xs font-medium uppercase tracking-wide text-slate-400",
  metaValue: "mt-1 text-slate-700",
  mobileActionArea: "mt-4 flex flex-col gap-2 sm:flex-row sm:items-center",
  desktopActionArea: "flex flex-col gap-2",
  actionButton: {
    base: "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    suspend: "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    activate: "bg-slate-900 text-white hover:bg-slate-800",
    delete: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
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

function formatRegion(item: PlatformBumDesaRow) {
  return [item.desa, item.kecamatan, item.kabupaten, item.provinsi]
    .filter(Boolean)
    .join(", ");
}

function BumDesaStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success">Aktif</Badge>
  ) : (
    <Badge variant="warning">Suspend</Badge>
  );
}

function BumDesaActions({
  item,
  mode,
}: {
  item: PlatformBumDesaRow;
  mode: "mobile" | "desktop";
}) {
  return (
    <div
      className={
        mode === "mobile"
          ? bumDesaListStyles.mobileActionArea
          : bumDesaListStyles.desktopActionArea
      }
    >
      {item.is_active ? (
        <form action={suspendBumDesa}>
          <input type="hidden" name="bumDesaId" value={item.id} />
          <button
            type="submit"
            className={`${bumDesaListStyles.actionButton.base} ${bumDesaListStyles.actionButton.suspend}`}
          >
            Suspend
          </button>
        </form>
      ) : (
        <form action={activateBumDesa}>
          <input type="hidden" name="bumDesaId" value={item.id} />
          <button
            type="submit"
            className={`${bumDesaListStyles.actionButton.base} ${bumDesaListStyles.actionButton.activate}`}
          >
            Aktifkan
          </button>
        </form>
      )}

      <form action={deleteBumDesa}>
        <input type="hidden" name="bumDesaId" value={item.id} />
        <input
          type="hidden"
          name="deleteReason"
          value="BUMDes dihapus dari daftar aktif oleh Super Admin."
        />
        <button
          type="submit"
          className={`${bumDesaListStyles.actionButton.base} ${bumDesaListStyles.actionButton.delete}`}
        >
          Hapus
        </button>
      </form>
    </div>
  );
}

export function BumDesaList({ bumDesa }: BumDesaListProps) {
  if (bumDesa.length === 0) {
    return (
      <div className={bumDesaListStyles.empty}>
        <EmptyState
          title="Belum ada data BUMDes"
          description="BUMDes yang disetujui dari proses pendaftaran akan tampil di sini."
        />
      </div>
    );
  }

  return (
    <div className={bumDesaListStyles.root}>
      <div className={bumDesaListStyles.mobileList}>
        {bumDesa.map((item) => (
          <article key={item.id} className={bumDesaListStyles.card}>
            <div className={bumDesaListStyles.cardHeader}>
              <div>
                <p className={bumDesaListStyles.code}>
                  No. {item.nomor} - {item.kode}
                </p>
                <h2 className={bumDesaListStyles.primaryText}>{item.nama}</h2>
                <p className={bumDesaListStyles.secondaryText}>
                  {formatRegion(item) || "-"}
                </p>
              </div>

              <BumDesaStatusBadge active={item.is_active} />
            </div>

            <div className={bumDesaListStyles.metaGrid}>
              <div>
                <p className={bumDesaListStyles.metaLabel}>NIB</p>
                <p className={bumDesaListStyles.metaValue}>{item.nib || "-"}</p>
              </div>

              <div>
                <p className={bumDesaListStyles.metaLabel}>Tanggal Dibuat</p>
                <p className={bumDesaListStyles.metaValue}>
                  {formatDate(item.created_at)}
                </p>
              </div>

              <div>
                <p className={bumDesaListStyles.metaLabel}>Alamat</p>
                <p className={bumDesaListStyles.metaValue}>
                  {item.alamat || "-"}
                </p>
              </div>
            </div>

            <BumDesaActions item={item} mode="mobile" />
          </article>
        ))}
      </div>

      <div className={bumDesaListStyles.desktopList}>
        <div className={bumDesaListStyles.desktopHeader}>
          <span>No</span>
          <span>Kode</span>
          <span>Nama BUMDes</span>
          <span>Wilayah</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>

        {bumDesa.map((item) => (
          <div key={item.id} className={bumDesaListStyles.desktopRow}>
            <p className={bumDesaListStyles.number}>{item.nomor}</p>

            <div>
              <p className={bumDesaListStyles.primaryText}>{item.kode}</p>
              <p className={bumDesaListStyles.secondaryText}>
                {formatDate(item.created_at)}
              </p>
            </div>

            <div>
              <p className={bumDesaListStyles.primaryText}>{item.nama}</p>
              <p className={bumDesaListStyles.secondaryText}>
                NIB: {item.nib || "-"}
              </p>
            </div>

            <p className={bumDesaListStyles.mutedText}>
              {formatRegion(item) || "-"}
            </p>

            <BumDesaStatusBadge active={item.is_active} />

            <BumDesaActions item={item} mode="desktop" />
          </div>
        ))}
      </div>
    </div>
  );
}

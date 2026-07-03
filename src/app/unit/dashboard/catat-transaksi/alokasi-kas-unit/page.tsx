import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { allocateCashToUnitAction } from "@/app/unit/dashboard/catat-transaksi/alokasi-kas-unit/actions";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type CashAllocationPageProps = {
  searchParams: Promise<{
    posted?: string;
  }>;
};

type TargetUnitOption = {
  id: string;
  code: string;
  name: string;
};

type CashAccountOption = {
  code: string;
  name: string;
};

const cashAllocationStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]",
  form: "w-full min-w-0 space-y-5",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select: "w-full min-w-0 truncate",
  helpText: "text-xs leading-5 text-slate-500",
  actions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  contextList: "min-w-0 space-y-3 text-sm",
  contextItem: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
  contextLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  contextValue: "mt-1 break-words font-semibold text-slate-900",
  successIcon: "h-4 w-4",
  noteIcon: "h-4 w-4",
};

async function getTargetUnitOptions(
  bumDesaId: string,
  currentUnitId: string
): Promise<TargetUnitOption[]> {
  const result = await db.query<TargetUnitOption>(
    `
      SELECT
        id::text,
        kode AS code,
        nama AS name
      FROM unit_usaha
      WHERE bum_desa_id = $1::uuid
        AND id <> $2::uuid
        AND jenis = 'unit_usaha'
        AND is_active = TRUE
      ORDER BY kode ASC, nama ASC
    `,
    [bumDesaId, currentUnitId]
  );

  return result.rows;
}

async function getCashAccountOptions(
  bumDesaId: string
): Promise<CashAccountOption[]> {
  const result = await db.query<CashAccountOption>(
    `
      SELECT
        kode AS code,
        nama AS name
      FROM akun
      WHERE is_active = TRUE
        AND level = 'D'
        AND kode LIKE '1.1.01.%'
        AND (bum_desa_id = $1::uuid OR bum_desa_id IS NULL)
      ORDER BY kode ASC
    `,
    [bumDesaId]
  );

  return result.rows;
}

export default async function CashAllocationPage({
  searchParams,
}: CashAllocationPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (context.unitType !== "kantor_pusat") {
    return (
      <UnitContextBlocker
        context={context}
        title="Alokasi Kas Unit Tidak Tersedia"
        description="Alokasi kas ke unit usaha hanya boleh dicatat dari konteks Kantor Pusat atau BUMDes."
        expectedContext="Kantor Pusat BUMDes"
      />
    );
  }

  const targetUnits = await getTargetUnitOptions(
    context.bumDesaId,
    context.unitUsahaId
  );
  const cashAccounts = await getCashAccountOptions(context.bumDesaId);
  const postedNumber = params.posted;

  return (
    <PageContainer>
      <Link
        href="/unit/dashboard/catat-transaksi"
        className={cashAllocationStyles.backLink}
      >
        <ArrowLeft className={cashAllocationStyles.backIcon} />
        Kembali ke Catat Transaksi
      </Link>

      <PageHeader
        title="Alokasi Kas ke Unit"
        description="Catat pemindahan kas dari Kantor Pusat BUMDes ke unit usaha. Saldo akun kas/bank pusat berkurang dan saldo akun kas/bank unit tujuan bertambah."
      />

      <div className={cashAllocationStyles.content}>
        {postedNumber ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={cashAllocationStyles.successIcon} />
                Alokasi kas berhasil diposting
              </span>
            </AlertTitle>
            <AlertDescription>Nomor jurnal: {postedNumber}</AlertDescription>
          </Alert>
        ) : null}

        <Alert>
          <Info className={cashAllocationStyles.noteIcon} />
          <AlertTitle>Jurnal manual antar unit</AlertTitle>
          <AlertDescription>
            Sistem akan mencatat Debit akun kas/bank pada unit tujuan dan
            Kredit akun kas/bank pada Kantor Pusat. Total kas BUMDes secara
            konsolidasi tetap sama.
          </AlertDescription>
        </Alert>

        <div className={cashAllocationStyles.grid}>
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Form Alokasi Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={allocateCashToUnitAction}
                className={cashAllocationStyles.form}
              >
                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="tanggal"
                    className={cashAllocationStyles.label}
                  >
                    Tanggal Transaksi
                  </Label>
                  <Input id="tanggal" name="tanggal" type="date" required />
                </div>

                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="targetUnitId"
                    className={cashAllocationStyles.label}
                  >
                    Unit Tujuan
                  </Label>
                  <Select
                    id="targetUnitId"
                    name="targetUnitId"
                    required
                    className={cashAllocationStyles.select}
                    disabled={targetUnits.length === 0}
                  >
                    <option value="">Pilih unit tujuan</option>
                    {targetUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.code} - {unit.name}
                      </option>
                    ))}
                  </Select>
                  <p className={cashAllocationStyles.helpText}>
                    Hanya unit usaha aktif dalam BUMDes yang sama yang dapat
                    dipilih.
                  </p>
                </div>

                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="sourceCashAccountCode"
                    className={cashAllocationStyles.label}
                  >
                    Akun Sumber Pusat
                  </Label>
                  <Select
                    id="sourceCashAccountCode"
                    name="sourceCashAccountCode"
                    required
                    className={cashAllocationStyles.select}
                    defaultValue="1.1.01.05"
                    disabled={cashAccounts.length === 0}
                  >
                    <option value="">Pilih akun sumber</option>
                    {cashAccounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={cashAllocationStyles.helpText}>
                    Pilih akun yang menyimpan dana di Kantor Pusat, misalnya
                    Kas di Bank BPD jika modal diterima lewat bank.
                  </p>
                </div>

                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="targetCashAccountCode"
                    className={cashAllocationStyles.label}
                  >
                    Akun Tujuan Unit
                  </Label>
                  <Select
                    id="targetCashAccountCode"
                    name="targetCashAccountCode"
                    required
                    className={cashAllocationStyles.select}
                    defaultValue="1.1.01.01"
                    disabled={cashAccounts.length === 0}
                  >
                    <option value="">Pilih akun tujuan</option>
                    {cashAccounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={cashAllocationStyles.helpText}>
                    Pilih akun kas/bank yang akan bertambah pada unit tujuan.
                  </p>
                </div>

                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="nominal"
                    className={cashAllocationStyles.label}
                  >
                    Nominal Alokasi
                  </Label>
                  <Input
                    id="nominal"
                    name="nominal"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.,]*"
                    placeholder="Contoh: 50000000"
                    required
                  />
                  <p className={cashAllocationStyles.helpText}>
                    Isi angka tanpa simbol rupiah. Saldo akun sumber pusat
                    harus mencukupi.
                  </p>
                </div>

                <div className={cashAllocationStyles.fieldGroup}>
                  <Label
                    htmlFor="keterangan"
                    className={cashAllocationStyles.label}
                  >
                    Keterangan
                  </Label>
                  <Textarea
                    id="keterangan"
                    name="keterangan"
                    rows={4}
                    placeholder="Contoh: Alokasi kas operasional awal untuk Unit Produksi 01"
                  />
                </div>

                <div className={cashAllocationStyles.actions}>
                  <Button
                    type="submit"
                    disabled={targetUnits.length === 0 || cashAccounts.length === 0}
                  >
                    Simpan Alokasi Kas
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Konteks Pusat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cashAllocationStyles.contextList}>
                <div className={cashAllocationStyles.contextItem}>
                  <p className={cashAllocationStyles.contextLabel}>BUMDes</p>
                  <p className={cashAllocationStyles.contextValue}>
                    {context.bumDesaName}
                  </p>
                </div>
                <div className={cashAllocationStyles.contextItem}>
                  <p className={cashAllocationStyles.contextLabel}>
                    Unit Sumber
                  </p>
                  <p className={cashAllocationStyles.contextValue}>
                    {context.unitUsahaName}
                  </p>
                </div>
                <div className={cashAllocationStyles.contextItem}>
                  <p className={cashAllocationStyles.contextLabel}>Kode Unit</p>
                  <p className={cashAllocationStyles.contextValue}>
                    {context.unitCode}
                  </p>
                </div>
                <div className={cashAllocationStyles.contextItem}>
                  <p className={cashAllocationStyles.contextLabel}>
                    Unit Tujuan Tersedia
                  </p>
                  <p className={cashAllocationStyles.contextValue}>
                    {targetUnits.length} unit usaha
                  </p>
                </div>
                <div className={cashAllocationStyles.contextItem}>
                  <p className={cashAllocationStyles.contextLabel}>
                    Akun Kas/Bank Tersedia
                  </p>
                  <p className={cashAllocationStyles.contextValue}>
                    {cashAccounts.length} akun
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
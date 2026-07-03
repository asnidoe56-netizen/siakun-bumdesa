import Link from "next/link";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { postCapitalContributionAction } from "@/app/unit/dashboard/catat-transaksi/terima-modal/actions";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCapitalContributionFormOptions } from "@/lib/unit/get-capital-contribution-form-options";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type CapitalContributionPageProps = {
  searchParams: Promise<{
    posted?: string;
  }>;
};

const capitalContributionStyles = {
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

export default async function CapitalContributionPage({
  searchParams,
}: CapitalContributionPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (context.unitType !== "kantor_pusat") {
    return (
      <UnitContextBlocker
        context={context}
        title="Terima Modal Tidak Tersedia"
        description="Penerimaan modal hanya boleh dicatat dari konteks Kantor Pusat atau BUMDes."
        expectedContext="Kantor Pusat BUMDes"
      />
    );
  }

  const formOptions = await getCapitalContributionFormOptions();
  const postedNumber = params.posted;

  return (
    <PageContainer>
      <Link
        href="/unit/dashboard/catat-transaksi"
        className={capitalContributionStyles.backLink}
      >
        <ArrowLeft className={capitalContributionStyles.backIcon} />
        Kembali ke Catat Transaksi
      </Link>

      <PageHeader
        title="Terima Modal"
        description="Catat penerimaan penyertaan modal desa, penyertaan modal masyarakat, atau modal donasi/sumbangan. Sistem akan membuat jurnal otomatis melalui template T19."
      />

      <div className={capitalContributionStyles.content}>
        {postedNumber ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2
                  className={capitalContributionStyles.successIcon}
                />
                Transaksi berhasil diposting
              </span>
            </AlertTitle>
            <AlertDescription>Nomor transaksi: {postedNumber}</AlertDescription>
          </Alert>
        ) : null}

        <Alert>
          <Info className={capitalContributionStyles.noteIcon} />
          <AlertTitle>Jurnal otomatis</AlertTitle>
          <AlertDescription>
            Sistem akan mencatat Debit Kas/Bank dan Kredit akun modal yang
            dipilih. Gunakan akun modal detail sesuai sumber penyertaan.
          </AlertDescription>
        </Alert>

        <div className={capitalContributionStyles.grid}>
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Form Penerimaan Modal</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={postCapitalContributionAction}
                className={capitalContributionStyles.form}
              >
                <div className={capitalContributionStyles.fieldGroup}>
                  <Label
                    htmlFor="tanggal"
                    className={capitalContributionStyles.label}
                  >
                    Tanggal Transaksi
                  </Label>
                  <Input id="tanggal" name="tanggal" type="date" required />
                </div>

                <div className={capitalContributionStyles.fieldGroup}>
                  <Label
                    htmlFor="nominal"
                    className={capitalContributionStyles.label}
                  >
                    Nominal Modal Diterima
                  </Label>
                  <Input
                    id="nominal"
                    name="nominal"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 5000000"
                    required
                  />
                  <p className={capitalContributionStyles.helpText}>
                    Isi angka tanpa simbol rupiah.
                  </p>
                </div>

                <div className={capitalContributionStyles.fieldGroup}>
                  <Label
                    htmlFor="cashAccountCode"
                    className={capitalContributionStyles.label}
                  >
                    Kas/Bank Tujuan
                  </Label>
                  <Select
                    id="cashAccountCode"
                    name="cashAccountCode"
                    defaultValue="1.1.01.01"
                    required
                    className={capitalContributionStyles.select}
                  >
                    {formOptions.cashAccountOptions.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={capitalContributionStyles.helpText}>
                    Pilih akun kas atau bank yang menerima modal.
                  </p>
                </div>

                <div className={capitalContributionStyles.fieldGroup}>
                  <Label
                    htmlFor="capitalAccountCode"
                    className={capitalContributionStyles.label}
                  >
                    Akun Modal
                  </Label>
                  <Select
                    id="capitalAccountCode"
                    name="capitalAccountCode"
                    defaultValue="3.1.01.01"
                    required
                    className={capitalContributionStyles.select}
                  >
                    {formOptions.capitalAccountOptions.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={capitalContributionStyles.helpText}>
                    Gunakan penyertaan modal desa, penyertaan modal masyarakat,
                    atau modal donasi/sumbangan.
                  </p>
                </div>

                <div className={capitalContributionStyles.fieldGroup}>
                  <Label
                    htmlFor="keterangan"
                    className={capitalContributionStyles.label}
                  >
                    Keterangan
                  </Label>
                  <Textarea
                    id="keterangan"
                    name="keterangan"
                    placeholder="Contoh: Penyertaan modal desa tahap awal"
                  />
                </div>

                <div className={capitalContributionStyles.actions}>
                  <Button type="submit">Simpan Transaksi</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Konteks Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={capitalContributionStyles.contextList}>
                <div className={capitalContributionStyles.contextItem}>
                  <p className={capitalContributionStyles.contextLabel}>
                    BUMDes
                  </p>
                  <p className={capitalContributionStyles.contextValue}>
                    {context.bumDesaName}
                  </p>
                </div>

                <div className={capitalContributionStyles.contextItem}>
                  <p className={capitalContributionStyles.contextLabel}>
                    Unit Usaha
                  </p>
                  <p className={capitalContributionStyles.contextValue}>
                    {context.unitUsahaName}
                  </p>
                </div>

                <div className={capitalContributionStyles.contextItem}>
                  <p className={capitalContributionStyles.contextLabel}>
                    Kode Unit
                  </p>
                  <p className={capitalContributionStyles.contextValue}>
                    {context.unitCode}
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
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { postCashIncomeAction } from "@/app/unit/dashboard/catat-transaksi/terima-pendapatan-tunai/actions";
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
import { getCashIncomeFormOptions } from "@/lib/unit/get-cash-income-form-options";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type CashIncomePageProps = {
  searchParams: Promise<{
    posted?: string;
  }>;
};

const cashIncomeStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink: "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]",
  form: "w-full min-w-0 space-y-5",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select: "w-full min-w-0 truncate",
  helpText: "text-xs leading-5 text-slate-500",
  actions: "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  contextList: "min-w-0 space-y-3 text-sm",
  contextItem: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
  contextLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  contextValue: "mt-1 break-words font-semibold text-slate-900",
  successIcon: "h-4 w-4",
};

export default async function CashIncomePage({
  searchParams,
}: CashIncomePageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode === "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Terima Pendapatan Tunai Tidak Tersedia"
        description="Penerimaan pendapatan tunai umum hanya tersedia untuk unit usaha non-produksi. Unit produksi barang jadi memakai alur Penjualan Produk agar stok dan HPP tetap akurat."
        expectedContext="Unit Usaha non-produksi"
      />
    );
  }

  const formOptions = await getCashIncomeFormOptions();
  const postedNumber = params.posted;

  return (
    <PageContainer>
      <Link
        href="/unit/dashboard/catat-transaksi"
        className={cashIncomeStyles.backLink}
      >
        <ArrowLeft className={cashIncomeStyles.backIcon} />
        Kembali ke Catat Transaksi
      </Link>

      <PageHeader
        title="Terima Pendapatan Tunai"
        description="Catat penerimaan kas dari penjualan atau pendapatan usaha. Sistem akan membuat pembukuan otomatis melalui Journal Engine."
      />

      <div className={cashIncomeStyles.content}>
        {postedNumber ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={cashIncomeStyles.successIcon} />
                Transaksi berhasil diposting
              </span>
            </AlertTitle>
            <AlertDescription>
              Nomor transaksi: {postedNumber}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className={cashIncomeStyles.grid}>
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Form Penerimaan Pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={postCashIncomeAction} className={cashIncomeStyles.form}>
                <div className={cashIncomeStyles.fieldGroup}>
                  <Label htmlFor="tanggal" className={cashIncomeStyles.label}>
                    Tanggal Transaksi
                  </Label>
                  <Input id="tanggal" name="tanggal" type="date" required />
                </div>

                <div className={cashIncomeStyles.fieldGroup}>
                  <Label htmlFor="nominal" className={cashIncomeStyles.label}>
                    Nominal Diterima
                  </Label>
                  <Input
                    id="nominal"
                    name="nominal"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Contoh: 150000"
                    required
                  />
                  <p className={cashIncomeStyles.helpText}>
                    Isi angka tanpa simbol rupiah.
                  </p>
                </div>

                <div className={cashIncomeStyles.fieldGroup}>
                  <Label
                    htmlFor="cashAccountCode"
                    className={cashIncomeStyles.label}
                  >
                    Kas/Bank Tujuan
                  </Label>
                  <Select
                    id="cashAccountCode"
                    name="cashAccountCode"
                    defaultValue="1.1.01.01"
                    required
                    className={cashIncomeStyles.select}
                  >
                    {formOptions.cashAccountOptions.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={cashIncomeStyles.helpText}>
                    Kode akun dikirim otomatis sesuai COA Kepmen 136 kelompok
                    1.1.01.xx.
                  </p>
                </div>

                <div className={cashIncomeStyles.fieldGroup}>
                  <Label
                    htmlFor="incomeAccountCode"
                    className={cashIncomeStyles.label}
                  >
                    Jenis Pendapatan
                  </Label>
                  <Select
                    id="incomeAccountCode"
                    name="incomeAccountCode"
                    defaultValue="4.1.01.01"
                    required
                    className={cashIncomeStyles.select}
                  >
                    {formOptions.incomeAccountOptions.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                  <p className={cashIncomeStyles.helpText}>
                    Kode akun dikirim otomatis sesuai COA Kepmen 136 kelompok
                    pendapatan usaha.
                  </p>
                </div>

                <div className={cashIncomeStyles.fieldGroup}>
                  <Label htmlFor="keterangan" className={cashIncomeStyles.label}>
                    Keterangan
                  </Label>
                  <Textarea
                    id="keterangan"
                    name="keterangan"
                    placeholder="Contoh: Penjualan tiket wisata hari ini"
                  />
                </div>

                <div className={cashIncomeStyles.actions}>
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
              <div className={cashIncomeStyles.contextList}>
                <div className={cashIncomeStyles.contextItem}>
                  <p className={cashIncomeStyles.contextLabel}>BUMDes</p>
                  <p className={cashIncomeStyles.contextValue}>
                    {context.bumDesaName}
                  </p>
                </div>

                <div className={cashIncomeStyles.contextItem}>
                  <p className={cashIncomeStyles.contextLabel}>Unit Usaha</p>
                  <p className={cashIncomeStyles.contextValue}>
                    {context.unitUsahaName}
                  </p>
                </div>

                <div className={cashIncomeStyles.contextItem}>
                  <p className={cashIncomeStyles.contextLabel}>Kode Unit</p>
                  <p className={cashIncomeStyles.contextValue}>
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
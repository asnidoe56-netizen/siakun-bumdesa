import Link from "next/link";
import { ArrowLeft, CheckCircle2, Factory } from "lucide-react";
import { createProductionBatchAction } from "@/app/unit/dashboard/produksi/catat-produksi/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { getProductionMaterialTypeLabel } from "@/lib/unit/get-production-material-data";
import {
  getProductionBatchList,
  getProductionRecordingFormulaOptions,
} from "@/lib/unit/get-production-recording-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type ProductionRecordingPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

const recordingPageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  successIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]",
  form: "w-full min-w-0 space-y-5",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  helpText: "text-xs leading-5 text-slate-500",
  formulaCard: "min-w-0 overflow-hidden border-slate-200",
  formulaHeader:
    "flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between",
  formulaTitle: "text-base font-semibold text-slate-950",
  formulaDescription: "text-sm leading-6 text-slate-600",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  twoCols: "grid gap-3 sm:grid-cols-2",
  lineList: "space-y-3",
  lineBox: "rounded-xl border border-slate-200 bg-white p-4",
  lineTitle: "text-sm font-semibold text-slate-900",
  lineMeta: "mt-1 text-xs leading-5 text-slate-500",
  actions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  contextList: "min-w-0 space-y-3 text-sm",
  contextItem: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
  contextLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  contextValue: "mt-1 break-words font-semibold text-slate-900",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 text-slate-700",
  tableCellStrong: "whitespace-nowrap px-4 py-3 font-semibold text-slate-950",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
};

function formatDecimal(value: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return value;
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(numberValue);
}

function formatCurrency(value: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ProductionRecordingPage({
  searchParams,
}: ProductionRecordingPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  const [formulas, batches] = await Promise.all([
    getProductionRecordingFormulaOptions(context),
    getProductionBatchList(context),
  ]);

  const createdBatch = params.created;
  const today = getTodayInputValue();

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={recordingPageStyles.backLink}>
        <ArrowLeft className={recordingPageStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Catat Produksi"
        description="Pilih resep, isi jumlah hasil produksi aktual, lalu sistem mencatat hasil produk masuk dan pemakaian bahan keluar."
      />

      <div className={recordingPageStyles.content}>
        {createdBatch ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={recordingPageStyles.successIcon} />
                Produksi berhasil dicatat
              </span>
            </AlertTitle>
            <AlertDescription>{createdBatch}</AlertDescription>
          </Alert>
        ) : null}

        {formulas.length === 0 ? (
          <Alert>
            <AlertTitle>Belum ada resep aktif</AlertTitle>
            <AlertDescription>
              Buat Formula / Resep Produksi terlebih dahulu sebelum mencatat
              produksi.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className={recordingPageStyles.grid}>
          <div className="min-w-0 space-y-6">
            {formulas.length > 0 ? (
              formulas.map((formula) => (
                <Card key={formula.id} className={recordingPageStyles.formulaCard}>
                  <CardHeader className={recordingPageStyles.formulaHeader}>
                    <div>
                      <CardTitle className={recordingPageStyles.formulaTitle}>
                        {formula.name}
                      </CardTitle>
                      <p className={recordingPageStyles.formulaDescription}>
                        Produk: {formula.productName} • Standar output:{" "}
                        {formatDecimal(formula.outputQuantity)}{" "}
                        {formula.productUnitOfMeasure}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={recordingPageStyles.badge}>
                        {formula.code}
                      </span>
                      {formula.isDefault ? (
                        <span className={recordingPageStyles.badge}>
                          Default
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form
                      action={createProductionBatchAction}
                      className={recordingPageStyles.form}
                    >
                      <input type="hidden" name="formulaId" value={formula.id} />

                      <div className={recordingPageStyles.twoCols}>
                        <div className={recordingPageStyles.fieldGroup}>
                          <Label
                            htmlFor={`productionDate_${formula.id}`}
                            className={recordingPageStyles.label}
                          >
                            Tanggal Produksi
                          </Label>
                          <Input
                            id={`productionDate_${formula.id}`}
                            name="productionDate"
                            type="date"
                            defaultValue={today}
                            required
                          />
                        </div>

                        <div className={recordingPageStyles.fieldGroup}>
                          <Label
                            htmlFor={`outputQuantity_${formula.id}`}
                            className={recordingPageStyles.label}
                          >
                            Hasil Produksi
                          </Label>
                          <Input
                            id={`outputQuantity_${formula.id}`}
                            name="outputQuantity"
                            type="number"
                            min="0.0001"
                            step="0.0001"
                            defaultValue={formula.outputQuantity}
                            required
                          />
                          <p className={recordingPageStyles.helpText}>
                            Satuan: {formula.productUnitOfMeasure}
                          </p>
                        </div>
                      </div>

                      <div className={recordingPageStyles.fieldGroup}>
                        <Label
                          htmlFor={`notes_${formula.id}`}
                          className={recordingPageStyles.label}
                        >
                          Catatan Produksi
                        </Label>
                        <Textarea
                          id={`notes_${formula.id}`}
                          name="notes"
                          placeholder="Contoh: produksi pagi, kondisi normal, atau catatan kandang."
                        />
                      </div>

                      <div className={recordingPageStyles.lineList}>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Bahan Sesuai Resep
                          </h3>
                          <p className={recordingPageStyles.helpText}>
                            Kosongkan jumlah aktual jika ingin sistem menghitung
                            otomatis berdasarkan hasil produksi.
                          </p>
                        </div>

                        {formula.lines.map((line) => (
                          <div key={line.id} className={recordingPageStyles.lineBox}>
                            <p className={recordingPageStyles.lineTitle}>
                              {line.materialName}
                            </p>
                            <p className={recordingPageStyles.lineMeta}>
                              {getProductionMaterialTypeLabel(line.materialType)} •
                              Standar resep: {formatDecimal(line.formulaQuantity)}{" "}
                              {line.unitOfMeasure} • Harga default:{" "}
                              {formatCurrency(line.unitCost)}
                            </p>

                            <div className={`${recordingPageStyles.twoCols} mt-3`}>
                              <div className={recordingPageStyles.fieldGroup}>
                                <Label
                                  htmlFor={`actualQuantity_${line.id}`}
                                  className={recordingPageStyles.label}
                                >
                                  Jumlah Aktual
                                </Label>
                                <Input
                                  id={`actualQuantity_${line.id}`}
                                  name={`actualQuantity_${line.id}`}
                                  type="number"
                                  min="0.0001"
                                  step="0.0001"
                                  placeholder="Otomatis"
                                />
                              </div>

                              <div className={recordingPageStyles.fieldGroup}>
                                <Label
                                  htmlFor={`unitCost_${line.id}`}
                                  className={recordingPageStyles.label}
                                >
                                  Harga Satuan
                                </Label>
                                <Input
                                  id={`unitCost_${line.id}`}
                                  name={`unitCost_${line.id}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder={line.unitCost}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={recordingPageStyles.actions}>
                        <Button type="submit">Simpan Catat Produksi</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className={recordingPageStyles.emptyState}>
                <div className={recordingPageStyles.emptyIcon}>
                  <Factory className="h-6 w-6" />
                </div>
                <h2 className={recordingPageStyles.emptyTitle}>
                  Belum bisa mencatat produksi
                </h2>
                <p className={recordingPageStyles.emptyDescription}>
                  Tambahkan produk, bahan, dan formula produksi terlebih dahulu.
                </p>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Riwayat Produksi Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length > 0 ? (
                  <div className={recordingPageStyles.tableWrapper}>
                    <div className={recordingPageStyles.tableScroll}>
                      <table className={recordingPageStyles.table}>
                        <thead className={recordingPageStyles.tableHead}>
                          <tr>
                            <th className={recordingPageStyles.tableHeadCell}>
                              Kode
                            </th>
                            <th className={recordingPageStyles.tableHeadCell}>
                              Tanggal
                            </th>
                            <th className={recordingPageStyles.tableHeadCell}>
                              Produk
                            </th>
                            <th className={recordingPageStyles.tableHeadCell}>
                              Output
                            </th>
                            <th className={recordingPageStyles.tableHeadCell}>
                              Biaya Bahan
                            </th>
                          </tr>
                        </thead>
                        <tbody className={recordingPageStyles.tableBody}>
                          {batches.map((batch) => (
                            <tr key={batch.id}>
                              <td className={recordingPageStyles.tableCellStrong}>
                                {batch.code}
                              </td>
                              <td className={recordingPageStyles.tableCell}>
                                {batch.productionDate}
                              </td>
                              <td className={recordingPageStyles.tableCell}>
                                {batch.productName}
                              </td>
                              <td className={recordingPageStyles.tableCell}>
                                {formatDecimal(batch.outputQuantity)}{" "}
                                {batch.outputUnitOfMeasure}
                              </td>
                              <td className={recordingPageStyles.tableCell}>
                                {formatCurrency(batch.totalMaterialCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={recordingPageStyles.emptyState}>
                    <div className={recordingPageStyles.emptyIcon}>
                      <Factory className="h-6 w-6" />
                    </div>
                    <h2 className={recordingPageStyles.emptyTitle}>
                      Belum ada produksi
                    </h2>
                    <p className={recordingPageStyles.emptyDescription}>
                      Riwayat produksi akan muncul setelah produksi pertama
                      dicatat.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Konteks Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={recordingPageStyles.contextList}>
                  <div className={recordingPageStyles.contextItem}>
                    <p className={recordingPageStyles.contextLabel}>BUMDes</p>
                    <p className={recordingPageStyles.contextValue}>
                      {context.bumDesaName}
                    </p>
                  </div>
                  <div className={recordingPageStyles.contextItem}>
                    <p className={recordingPageStyles.contextLabel}>Unit Usaha</p>
                    <p className={recordingPageStyles.contextValue}>
                      {context.unitUsahaName}
                    </p>
                  </div>
                  <div className={recordingPageStyles.contextItem}>
                    <p className={recordingPageStyles.contextLabel}>
                      Kategori Bisnis
                    </p>
                    <p className={recordingPageStyles.contextValue}>
                      {context.businessCategoryName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
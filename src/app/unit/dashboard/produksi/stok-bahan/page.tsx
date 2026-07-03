import Link from "next/link";
import { ArrowLeft, Boxes, PlusCircle } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnitContextBlocker } from "@/components/unit/unit-context-blocker";
import { getProductionMaterialTypeLabel } from "@/lib/unit/get-production-material-data";
import {
  getMaterialMovementList,
  getMaterialStockList,
} from "@/lib/unit/get-material-stock-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { createMaterialStockInAction } from "./actions";

export const dynamic = "force-dynamic";

const materialStockPageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  grid: "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
  stockCard: "min-w-0 overflow-hidden",
  stockHeader: "flex items-start justify-between gap-3",
  stockIcon:
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700",
  stockTitle: "break-words text-base font-semibold text-slate-950",
  stockCode: "mt-1 text-xs font-medium uppercase tracking-wide text-slate-500",
  stockQty: "mt-4 text-3xl font-bold tracking-tight text-slate-950",
  stockQtyMinus: "mt-4 text-3xl font-bold tracking-tight text-rose-700",
  stockMeta: "mt-2 text-sm text-slate-600",
  stockValue: "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3",
  stockWarning:
    "mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800",
  stockValueLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  stockValueAmount: "mt-1 text-sm font-semibold text-slate-900",
  stockValueMinus: "mt-1 text-sm font-semibold text-rose-700",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "w-full table-fixed divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "break-words px-3 py-3 text-slate-700",
  tableCellStrong: "break-words px-3 py-3 font-semibold text-slate-950",
  badgeIn:
    "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700",
  badgeOut:
    "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700",
  badgeNeutral:
    "inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
  infoBox: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600",
  formGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
  fieldGroup: "space-y-2",
  label: "text-sm font-medium text-slate-700",
  input:
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
  textarea:
    "min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200",
  formActions: "mt-5 flex justify-end",
  submitButton:
    "inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800",
  submitIcon: "h-4 w-4",
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

function formatSignedCurrency(value: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue === 0) {
    return "-";
  }

  const absoluteValue = Math.abs(numberValue);
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(absoluteValue);

  return numberValue < 0 ? `-${formatted}` : formatted;
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

function getMovementLabel(direction: "IN" | "OUT") {
  return direction === "IN" ? "Masuk" : "Keluar";
}

function getMovementBadgeClass(direction: "IN" | "OUT") {
  return direction === "IN"
    ? materialStockPageStyles.badgeIn
    : materialStockPageStyles.badgeOut;
}

function getMovementSourceLabel(source: string) {
  if (source === "PRODUCTION_MATERIAL_USAGE") {
    return "Pemakaian Produksi";
  }

  if (source === "ADJUSTMENT") {
    return "Penyesuaian";
  }

  return source;
}

export default async function MaterialStockPage() {
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Stok Bahan Tidak Tersedia"
        description="Stok bahan dan komponen produksi hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const [stocks, movements] = await Promise.all([
    getMaterialStockList(context),
    getMaterialMovementList(context),
  ]);

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={materialStockPageStyles.backLink}>
        <ArrowLeft className={materialStockPageStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Stok Bahan / Komponen"
        description="Pantau saldo bahan baku dan komponen dari pergerakan stok produksi."
      />

      <div className={materialStockPageStyles.content}>
        <div className={materialStockPageStyles.infoBox}>
          Stok bahan dihitung dari pergerakan stok database. Saat ini produksi
          sudah mencatat bahan keluar. Jika belum ada pencatatan bahan masuk dari
          pembelian atau penyesuaian stok, saldo bahan dapat terlihat minus.
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catat Stok Awal / Bahan Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMaterialStockInAction}>
              <div className={materialStockPageStyles.formGrid}>
                <div className={materialStockPageStyles.fieldGroup}>
                  <label
                    htmlFor="movementDate"
                    className={materialStockPageStyles.label}
                  >
                    Tanggal
                  </label>
                  <input
                    id="movementDate"
                    name="movementDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className={materialStockPageStyles.input}
                  />
                </div>

                <div className={materialStockPageStyles.fieldGroup}>
                  <label
                    htmlFor="materialId"
                    className={materialStockPageStyles.label}
                  >
                    Bahan / Komponen
                  </label>
                  <select
                    id="materialId"
                    name="materialId"
                    required
                    className={materialStockPageStyles.input}
                  >
                    <option value="">Pilih bahan</option>
                    {stocks.map((stock) => (
                      <option key={stock.materialId} value={stock.materialId}>
                        {stock.materialName} ({stock.unitOfMeasure})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={materialStockPageStyles.fieldGroup}>
                  <label
                    htmlFor="quantity"
                    className={materialStockPageStyles.label}
                  >
                    Jumlah Masuk
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    placeholder="Contoh: 100"
                    className={materialStockPageStyles.input}
                  />
                </div>

                <div className={materialStockPageStyles.fieldGroup}>
                  <label
                    htmlFor="unitCost"
                    className={materialStockPageStyles.label}
                  >
                    Biaya per Satuan
                  </label>
                  <input
                    id="unitCost"
                    name="unitCost"
                    type="number"
                    step="0.000001"
                    min="0"
                    placeholder="Contoh: 5000"
                    className={materialStockPageStyles.input}
                  />
                </div>
              </div>

              <div className={`${materialStockPageStyles.fieldGroup} mt-4`}>
                <label htmlFor="notes" className={materialStockPageStyles.label}>
                  Catatan
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Contoh: Stok awal sebelum pencatatan produksi"
                  className={materialStockPageStyles.textarea}
                />
              </div>

              <div className={materialStockPageStyles.formActions}>
                <button
                  type="submit"
                  className={materialStockPageStyles.submitButton}
                >
                  <PlusCircle className={materialStockPageStyles.submitIcon} />
                  Simpan Bahan Masuk
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {stocks.length > 0 ? (
          <div className={materialStockPageStyles.grid}>
            {stocks.map((stock) => {
              const quantityValue = Number(stock.quantityOnHand);
              const totalValue = Number(stock.totalValue);
              const isNegative = Number.isFinite(quantityValue) && quantityValue < 0;

              return (
                <Card key={stock.materialId} className={materialStockPageStyles.stockCard}>
                  <CardHeader>
                    <div className={materialStockPageStyles.stockHeader}>
                      <div className="min-w-0">
                        <CardTitle className={materialStockPageStyles.stockTitle}>
                          {stock.materialName}
                        </CardTitle>
                        <p className={materialStockPageStyles.stockCode}>
                          {stock.materialCode}
                        </p>
                      </div>
                      <div className={materialStockPageStyles.stockIcon}>
                        <Boxes className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <span className={materialStockPageStyles.badgeNeutral}>
                      {getProductionMaterialTypeLabel(stock.materialType)}
                    </span>

                    <p
                      className={
                        isNegative
                          ? materialStockPageStyles.stockQtyMinus
                          : materialStockPageStyles.stockQty
                      }
                    >
                      {formatDecimal(stock.quantityOnHand)}
                    </p>
                    <p className={materialStockPageStyles.stockMeta}>
                      Satuan: {stock.unitOfMeasure}
                    </p>
                    <p className={materialStockPageStyles.stockMeta}>
                      Status stok:{" "}
                      {stock.isStocked ? "Dipantau" : "Tidak dipantau"}
                    </p>

                    {isNegative ? (
                      <div className={materialStockPageStyles.stockWarning}>
                        Saldo bahan minus. Ini biasanya terjadi karena bahan
                        keluar sudah tercatat, tetapi pembelian atau stok awal
                        bahan belum dicatat.
                      </div>
                    ) : null}

                    <div className={materialStockPageStyles.stockValue}>
                      <p className={materialStockPageStyles.stockValueLabel}>
                        Nilai Stok
                      </p>
                      <p
                        className={
                          Number.isFinite(totalValue) && totalValue < 0
                            ? materialStockPageStyles.stockValueMinus
                            : materialStockPageStyles.stockValueAmount
                        }
                      >
                        {formatSignedCurrency(stock.totalValue)}
                      </p>
                    </div>

                    <div className={materialStockPageStyles.stockValue}>
                      <p className={materialStockPageStyles.stockValueLabel}>
                        Rata-rata Biaya per Satuan
                      </p>
                      <p className={materialStockPageStyles.stockValueAmount}>
                        {formatCurrency(stock.averageUnitCost)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className={materialStockPageStyles.emptyState}>
            <div className={materialStockPageStyles.emptyIcon}>
              <Boxes className="h-6 w-6" />
            </div>
            <h2 className={materialStockPageStyles.emptyTitle}>
              Belum ada bahan / komponen
            </h2>
            <p className={materialStockPageStyles.emptyDescription}>
              Tambahkan bahan baku atau komponen produksi terlebih dahulu.
            </p>
          </div>
        )}

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Riwayat Pergerakan Bahan</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length > 0 ? (
              <div className={materialStockPageStyles.tableWrapper}>
                <div className={materialStockPageStyles.tableScroll}>
                  <table className={materialStockPageStyles.table}>
                    <thead className={materialStockPageStyles.tableHead}>
                      <tr>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Tanggal
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Batch
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Bahan
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Jenis
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Arah
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Sumber
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Jumlah
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Biaya/Satuan
                        </th>
                        <th className={materialStockPageStyles.tableHeadCell}>
                          Nilai
                        </th>
                      </tr>
                    </thead>
                    <tbody className={materialStockPageStyles.tableBody}>
                      {movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className={materialStockPageStyles.tableCell}>
                            {movement.movementDate}
                          </td>
                          <td className={materialStockPageStyles.tableCellStrong}>
                            {movement.batchCode ?? "-"}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {movement.materialName}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {getProductionMaterialTypeLabel(
                              movement.materialType
                            )}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            <span
                              className={getMovementBadgeClass(
                                movement.movementDirection
                              )}
                            >
                              {getMovementLabel(movement.movementDirection)}
                            </span>
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {getMovementSourceLabel(movement.movementSource)}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {formatDecimal(movement.quantity)}{" "}
                            {movement.unitOfMeasure}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {formatCurrency(movement.unitCost)}
                          </td>
                          <td className={materialStockPageStyles.tableCell}>
                            {formatCurrency(movement.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={materialStockPageStyles.emptyState}>
                <div className={materialStockPageStyles.emptyIcon}>
                  <Boxes className="h-6 w-6" />
                </div>
                <h2 className={materialStockPageStyles.emptyTitle}>
                  Belum ada pergerakan bahan
                </h2>
                <p className={materialStockPageStyles.emptyDescription}>
                  Pergerakan bahan akan muncul setelah produksi atau pembelian
                  bahan dicatat.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
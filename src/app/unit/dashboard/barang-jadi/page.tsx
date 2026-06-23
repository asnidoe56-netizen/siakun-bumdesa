import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getFinishedGoodsMovementList,
  getFinishedGoodsStockList,
} from "@/lib/unit/get-finished-goods-stock-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

const stockPageStyles = {
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
  stockMeta: "mt-2 text-sm text-slate-600",
  stockValue: "mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3",
  stockValueLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  stockValueAmount: "mt-1 text-sm font-semibold text-slate-900",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto",
  table: "min-w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 text-slate-700",
  tableCellStrong: "whitespace-nowrap px-4 py-3 font-semibold text-slate-950",
  badgeIn:
    "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700",
  badgeOut:
    "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
  infoBox: "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600",
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

function getMovementLabel(direction: "IN" | "OUT") {
  return direction === "IN" ? "Masuk" : "Keluar";
}

function getMovementBadgeClass(direction: "IN" | "OUT") {
  return direction === "IN" ? stockPageStyles.badgeIn : stockPageStyles.badgeOut;
}

export default async function FinishedGoodsStockPage() {
  const context = await getUnitWorkContext();

  const [stocks, movements] = await Promise.all([
    getFinishedGoodsStockList(context),
    getFinishedGoodsMovementList(context),
  ]);

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={stockPageStyles.backLink}>
        <ArrowLeft className={stockPageStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Stok Produksi / Barang Jadi"
        description="Pantau saldo produk jadi dari hasil produksi yang sudah dicatat."
      />

      <div className={stockPageStyles.content}>
        <div className={stockPageStyles.infoBox}>
          Stok barang jadi dihitung dari pergerakan stok database. Hasil produksi
          masuk sebagai stok produk, sedangkan penjualan produk nanti akan
          mengurangi stok melalui transaksi penjualan.
        </div>

        {stocks.length > 0 ? (
          <div className={stockPageStyles.grid}>
            {stocks.map((stock) => (
              <Card key={stock.productId} className={stockPageStyles.stockCard}>
                <CardHeader>
                  <div className={stockPageStyles.stockHeader}>
                    <div className="min-w-0">
                      <CardTitle className={stockPageStyles.stockTitle}>
                        {stock.productName}
                      </CardTitle>
                      <p className={stockPageStyles.stockCode}>
                        {stock.productCode}
                      </p>
                    </div>
                    <div className={stockPageStyles.stockIcon}>
                      <PackageCheck className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={stockPageStyles.stockQty}>
                    {formatDecimal(stock.quantityOnHand)}
                  </p>
                  <p className={stockPageStyles.stockMeta}>
                    Satuan: {stock.unitOfMeasure}
                  </p>

                  <div className={stockPageStyles.stockValue}>
                    <p className={stockPageStyles.stockValueLabel}>
                      Nilai Stok
                    </p>
                    <p className={stockPageStyles.stockValueAmount}>
                      {formatCurrency(stock.totalValue)}
                    </p>
                  </div>

                  <div className={stockPageStyles.stockValue}>
                    <p className={stockPageStyles.stockValueLabel}>
                      Rata-rata Biaya per Satuan
                    </p>
                    <p className={stockPageStyles.stockValueAmount}>
                      {formatCurrency(stock.averageUnitCost)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={stockPageStyles.emptyState}>
            <div className={stockPageStyles.emptyIcon}>
              <PackageCheck className="h-6 w-6" />
            </div>
            <h2 className={stockPageStyles.emptyTitle}>
              Belum ada produk barang jadi
            </h2>
            <p className={stockPageStyles.emptyDescription}>
              Tambahkan produk dan catat produksi terlebih dahulu agar stok
              barang jadi muncul.
            </p>
          </div>
        )}

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Riwayat Pergerakan Barang Jadi</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length > 0 ? (
              <div className={stockPageStyles.tableWrapper}>
                <div className={stockPageStyles.tableScroll}>
                  <table className={stockPageStyles.table}>
                    <thead className={stockPageStyles.tableHead}>
                      <tr>
                        <th className={stockPageStyles.tableHeadCell}>
                          Tanggal
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Batch
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Produk
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Arah
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Jumlah
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Biaya/Satuan
                        </th>
                        <th className={stockPageStyles.tableHeadCell}>
                          Nilai
                        </th>
                      </tr>
                    </thead>
                    <tbody className={stockPageStyles.tableBody}>
                      {movements.map((movement) => (
                        <tr key={movement.id}>
                          <td className={stockPageStyles.tableCell}>
                            {movement.movementDate}
                          </td>
                          <td className={stockPageStyles.tableCellStrong}>
                            {movement.batchCode ?? "-"}
                          </td>
                          <td className={stockPageStyles.tableCell}>
                            {movement.productName}
                          </td>
                          <td className={stockPageStyles.tableCell}>
                            <span
                              className={getMovementBadgeClass(
                                movement.movementDirection
                              )}
                            >
                              {getMovementLabel(movement.movementDirection)}
                            </span>
                          </td>
                          <td className={stockPageStyles.tableCell}>
                            {formatDecimal(movement.quantity)}{" "}
                            {movement.unitOfMeasure}
                          </td>
                          <td className={stockPageStyles.tableCell}>
                            {formatCurrency(movement.unitCost)}
                          </td>
                          <td className={stockPageStyles.tableCell}>
                            {formatCurrency(movement.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={stockPageStyles.emptyState}>
                <div className={stockPageStyles.emptyIcon}>
                  <PackageCheck className="h-6 w-6" />
                </div>
                <h2 className={stockPageStyles.emptyTitle}>
                  Belum ada pergerakan barang jadi
                </h2>
                <p className={stockPageStyles.emptyDescription}>
                  Pergerakan barang jadi akan muncul setelah produksi dicatat.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
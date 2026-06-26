import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package, ShoppingCart } from "lucide-react";
import { createFinishedGoodsSaleAction } from "@/app/unit/dashboard/penjualan-produk/actions";
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
import {
  getFinishedGoodsSaleHistoryList,
  getFinishedGoodsSaleProductOptions,
} from "@/lib/unit/get-finished-goods-sale-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type FinishedGoodsSalePageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

const salePageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  successIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_460px]",
  productList: "min-w-0 space-y-5",
  productCard: "min-w-0 overflow-hidden border-slate-200",
  productHeader:
    "flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between",
  productTitle: "text-base font-semibold text-slate-950",
  productDescription: "text-sm leading-6 text-slate-600",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  summaryGrid: "grid gap-3 sm:grid-cols-3",
  summaryBox: "rounded-lg border border-slate-200 bg-white px-3 py-2",
  summaryLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  summaryValue: "mt-1 break-words font-semibold text-slate-900",
  form: "mt-5 space-y-4",
  twoCols: "grid gap-3 sm:grid-cols-2",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  helpText: "text-xs leading-5 text-slate-500",
  actions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  sideColumn: "min-w-0 space-y-6",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "w-full table-fixed divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "break-words px-3 py-3 text-slate-700",
  tableCellStrong: "break-words px-3 py-3 font-semibold text-slate-950",
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

function getPaymentMethodLabel(value: string) {
  if (value === "CASH") {
    return "Tunai";
  }

  if (value === "CREDIT") {
    return "Kredit";
  }

  return value;
}

export default async function FinishedGoodsSalePage({
  searchParams,
}: FinishedGoodsSalePageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  const [products, sales] = await Promise.all([
    getFinishedGoodsSaleProductOptions(context),
    getFinishedGoodsSaleHistoryList(context),
  ]);

  const createdSale = params.created;
  const today = getTodayInputValue();

  return (
    <PageContainer>
      <Link href="/unit/dashboard" className={salePageStyles.backLink}>
        <ArrowLeft className={salePageStyles.backIcon} />
        Kembali ke Dashboard Unit
      </Link>

      <PageHeader
        title="Penjualan Produk"
        description="Catat penjualan barang jadi dari stok produksi. Sistem akan mengurangi stok, menghitung HPP, dan membuat jurnal otomatis."
      />

      <div className={salePageStyles.content}>
        {createdSale ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={salePageStyles.successIcon} />
                Penjualan berhasil dicatat
              </span>
            </AlertTitle>
            <AlertDescription>{createdSale}</AlertDescription>
          </Alert>
        ) : null}

        <div className={salePageStyles.grid}>
          <div className={salePageStyles.productList}>
            {products.length > 0 ? (
              products.map((product) => {
                const quantityOnHand = Number(product.quantityOnHand);
                const hasStock =
                  Number.isFinite(quantityOnHand) && quantityOnHand > 0;
                const hasFixedRevenueAccount =
                  product.revenueMappingStrategy === "FIXED_CODE" &&
                  Boolean(product.salesRevenueAccountCode);

                return (
                  <Card
                    key={product.productId}
                    className={salePageStyles.productCard}
                  >
                    <CardHeader className={salePageStyles.productHeader}>
                      <div>
                        <CardTitle className={salePageStyles.productTitle}>
                          {product.productName}
                        </CardTitle>
                        <p className={salePageStyles.productDescription}>
                          Kode: {product.productCode} • Satuan:{" "}
                          {product.unitOfMeasure}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={salePageStyles.badge}>
                          {product.revenueMappingLabel}
                        </span>
                        <span className={salePageStyles.badge}>
                          {product.salesRevenueAccountCode ?? "Akun belum tetap"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      <div className={salePageStyles.summaryGrid}>
                        <div className={salePageStyles.summaryBox}>
                          <p className={salePageStyles.summaryLabel}>
                            Stok tersedia
                          </p>
                          <p className={salePageStyles.summaryValue}>
                            {formatDecimal(product.quantityOnHand)}{" "}
                            {product.unitOfMeasure}
                          </p>
                        </div>
                        <div className={salePageStyles.summaryBox}>
                          <p className={salePageStyles.summaryLabel}>
                            HPP rata-rata
                          </p>
                          <p className={salePageStyles.summaryValue}>
                            {formatCurrency(product.averageUnitCost)}
                          </p>
                        </div>
                        <div className={salePageStyles.summaryBox}>
                          <p className={salePageStyles.summaryLabel}>
                            Harga jual default
                          </p>
                          <p className={salePageStyles.summaryValue}>
                            {formatCurrency(product.defaultSellingPrice)}
                          </p>
                        </div>
                      </div>

                      {!hasStock ? (
                        <Alert>
                          <AlertTitle>Stok belum tersedia</AlertTitle>
                          <AlertDescription>
                            Produk ini belum bisa dijual karena stok barang jadi
                            masih kosong.
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      {!hasFixedRevenueAccount ? (
                        <Alert>
                          <AlertTitle>Akun pendapatan belum detail</AlertTitle>
                          <AlertDescription>
                            Mapping pendapatan produk harus memakai akun detail
                            tetap sebelum penjualan bisa dicatat.
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      <form
                        action={createFinishedGoodsSaleAction}
                        className={salePageStyles.form}
                      >
                        <input
                          type="hidden"
                          name="productId"
                          value={product.productId}
                        />

                        <div className={salePageStyles.twoCols}>
                          <div className={salePageStyles.fieldGroup}>
                            <Label
                              htmlFor={`saleDate_${product.productId}`}
                              className={salePageStyles.label}
                            >
                              Tanggal Penjualan
                            </Label>
                            <Input
                              id={`saleDate_${product.productId}`}
                              name="saleDate"
                              type="date"
                              defaultValue={today}
                            />
                          </div>

                          <div className={salePageStyles.fieldGroup}>
                            <Label
                              htmlFor={`customerName_${product.productId}`}
                              className={salePageStyles.label}
                            >
                              Nama Pembeli
                            </Label>
                            <Input
                              id={`customerName_${product.productId}`}
                              name="customerName"
                              placeholder="Opsional"
                            />
                          </div>
                        </div>

                        <div className={salePageStyles.twoCols}>
                          <div className={salePageStyles.fieldGroup}>
                            <Label
                              htmlFor={`quantity_${product.productId}`}
                              className={salePageStyles.label}
                            >
                              Jumlah Dijual
                            </Label>
                            <Input
                              id={`quantity_${product.productId}`}
                              name="quantity"
                              type="number"
                              min="0.0001"
                              step="0.0001"
                              placeholder={`Contoh: 1 ${product.unitOfMeasure}`}
                              disabled={!hasStock || !hasFixedRevenueAccount}
                            />
                          </div>

                          <div className={salePageStyles.fieldGroup}>
                            <Label
                              htmlFor={`sellingUnitPrice_${product.productId}`}
                              className={salePageStyles.label}
                            >
                              Harga Jual Satuan
                            </Label>
                            <Input
                              id={`sellingUnitPrice_${product.productId}`}
                              name="sellingUnitPrice"
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={Number(
                                product.defaultSellingPrice
                              ).toFixed(0)}
                              disabled={!hasStock || !hasFixedRevenueAccount}
                            />
                            <p className={salePageStyles.helpText}>
                              Pembayaran awal dicatat sebagai tunai ke Kas Tunai.
                            </p>
                          </div>
                        </div>

                        <div className={salePageStyles.fieldGroup}>
                          <Label
                            htmlFor={`notes_${product.productId}`}
                            className={salePageStyles.label}
                          >
                            Catatan
                          </Label>
                          <Textarea
                            id={`notes_${product.productId}`}
                            name="notes"
                            placeholder="Contoh: penjualan telur pagi, pembeli pasar, atau catatan lain."
                            disabled={!hasStock || !hasFixedRevenueAccount}
                          />
                        </div>

                        <div className={salePageStyles.actions}>
                          <Button
                            type="submit"
                            disabled={!hasStock || !hasFixedRevenueAccount}
                          >
                            Simpan Penjualan
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className={salePageStyles.emptyState}>
                <div className={salePageStyles.emptyIcon}>
                  <Package className="h-6 w-6" />
                </div>
                <h2 className={salePageStyles.emptyTitle}>
                  Belum ada produk barang jadi
                </h2>
                <p className={salePageStyles.emptyDescription}>
                  Tambahkan produk dan catat produksi terlebih dahulu sebelum
                  mencatat penjualan.
                </p>
              </div>
            )}
          </div>

          <div className={salePageStyles.sideColumn}>
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Riwayat Penjualan Produk</CardTitle>
              </CardHeader>
              <CardContent>
                {sales.length > 0 ? (
                  <div className={salePageStyles.tableWrapper}>
                    <div className={salePageStyles.tableScroll}>
                      <table className={salePageStyles.table}>
                        <thead className={salePageStyles.tableHead}>
                          <tr>
                            <th className={salePageStyles.tableHeadCell}>
                              Kode
                            </th>
                            <th className={salePageStyles.tableHeadCell}>
                              Tanggal
                            </th>
                            <th className={salePageStyles.tableHeadCell}>
                              Penjualan
                            </th>
                            <th className={salePageStyles.tableHeadCell}>
                              HPP
                            </th>
                          </tr>
                        </thead>
                        <tbody className={salePageStyles.tableBody}>
                          {sales.map((sale) => (
                            <tr key={sale.id}>
                              <td className={salePageStyles.tableCellStrong}>
                                {sale.code}
                              </td>
                              <td className={salePageStyles.tableCell}>
                                {sale.saleDate}
                              </td>
                              <td className={salePageStyles.tableCell}>
                                {formatCurrency(sale.totalSalesAmount)}
                              </td>
                              <td className={salePageStyles.tableCell}>
                                {formatCurrency(sale.totalCogsAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={salePageStyles.emptyState}>
                    <div className={salePageStyles.emptyIcon}>
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <h2 className={salePageStyles.emptyTitle}>
                      Belum ada penjualan
                    </h2>
                    <p className={salePageStyles.emptyDescription}>
                      Riwayat penjualan produk akan muncul setelah transaksi
                      pertama dicatat.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Konteks Pencatatan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className={salePageStyles.summaryBox}>
                    <p className={salePageStyles.summaryLabel}>BUMDes</p>
                    <p className={salePageStyles.summaryValue}>
                      {context.bumDesaName}
                    </p>
                  </div>
                  <div className={salePageStyles.summaryBox}>
                    <p className={salePageStyles.summaryLabel}>Unit Usaha</p>
                    <p className={salePageStyles.summaryValue}>
                      {context.unitUsahaName}
                    </p>
                  </div>
                  <div className={salePageStyles.summaryBox}>
                    <p className={salePageStyles.summaryLabel}>
                      Metode awal
                    </p>
                    <p className={salePageStyles.summaryValue}>
                      {getPaymentMethodLabel("CASH")} ke Kas Tunai
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
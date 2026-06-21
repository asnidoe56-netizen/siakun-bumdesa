import Link from "next/link";
import { ArrowLeft, CheckCircle2, PackagePlus } from "lucide-react";
import { createProductionProductAction } from "@/app/unit/dashboard/produksi/data-produk/actions";
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
  getProductionProductList,
  getProductionRevenueOptions,
} from "@/lib/unit/get-production-product-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type ProductionProductPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

const dataProductStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  successIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]",
  form: "w-full min-w-0 space-y-5",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helpText: "text-xs leading-5 text-slate-500",
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
  badge:
    "inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
};

function formatCurrency(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProductionProductPage({
  searchParams,
}: ProductionProductPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();
  const [revenueOptions, products] = await Promise.all([
    getProductionRevenueOptions(),
    getProductionProductList(context),
  ]);
  const createdProduct = params.created;

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={dataProductStyles.backLink}>
        <ArrowLeft className={dataProductStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Data Produk"
        description="Kelola produk hasil produksi unit usaha, seperti telur, es kristal, kopi kemasan, katering, atau produk barang jadi lainnya."
      />

      <div className={dataProductStyles.content}>
        {createdProduct ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={dataProductStyles.successIcon} />
                Produk berhasil ditambahkan
              </span>
            </AlertTitle>
            <AlertDescription>{createdProduct}</AlertDescription>
          </Alert>
        ) : null}

        <div className={dataProductStyles.grid}>
          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Daftar Produk Produksi</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <div className={dataProductStyles.tableWrapper}>
                    <div className={dataProductStyles.tableScroll}>
                      <table className={dataProductStyles.table}>
                        <thead className={dataProductStyles.tableHead}>
                          <tr>
                            <th className={dataProductStyles.tableHeadCell}>
                              Kode
                            </th>
                            <th className={dataProductStyles.tableHeadCell}>
                              Produk
                            </th>
                            <th className={dataProductStyles.tableHeadCell}>
                              Jenis
                            </th>
                            <th className={dataProductStyles.tableHeadCell}>
                              Satuan
                            </th>
                            <th className={dataProductStyles.tableHeadCell}>
                              Harga Default
                            </th>
                            <th className={dataProductStyles.tableHeadCell}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className={dataProductStyles.tableBody}>
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td className={dataProductStyles.tableCellStrong}>
                                {product.code}
                              </td>
                              <td className={dataProductStyles.tableCellStrong}>
                                {product.name}
                              </td>
                              <td className={dataProductStyles.tableCell}>
                                {product.revenueLabel}
                              </td>
                              <td className={dataProductStyles.tableCell}>
                                {product.unitOfMeasure}
                              </td>
                              <td className={dataProductStyles.tableCell}>
                                {formatCurrency(product.defaultSellingPrice)}
                              </td>
                              <td className={dataProductStyles.tableCell}>
                                <span className={dataProductStyles.badge}>
                                  {product.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={dataProductStyles.emptyState}>
                    <div className={dataProductStyles.emptyIcon}>
                      <PackagePlus className="h-6 w-6" />
                    </div>
                    <h2 className={dataProductStyles.emptyTitle}>
                      Belum ada produk produksi
                    </h2>
                    <p className={dataProductStyles.emptyDescription}>
                      Tambahkan produk pertama, misalnya Telur, Es Kristal, Kopi
                      Kemasan, Katering, atau produk barang jadi lain.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Tambah Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={createProductionProductAction}
                  className={dataProductStyles.form}
                >
                  <div className={dataProductStyles.fieldGroup}>
                    <Label htmlFor="code" className={dataProductStyles.label}>
                      Kode Produk
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Contoh: TELUR-001"
                      required
                    />
                    <p className={dataProductStyles.helpText}>
                      Kode akan disimpan sebagai huruf besar.
                    </p>
                  </div>

                  <div className={dataProductStyles.fieldGroup}>
                    <Label htmlFor="name" className={dataProductStyles.label}>
                      Nama Produk
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Contoh: Telur Ayam"
                      required
                    />
                  </div>

                  <div className={dataProductStyles.fieldGroup}>
                    <Label
                      htmlFor="businessRevenueMappingId"
                      className={dataProductStyles.label}
                    >
                      Jenis Produk
                    </Label>
                    <select
                      id="businessRevenueMappingId"
                      name="businessRevenueMappingId"
                      className={dataProductStyles.select}
                      required
                    >
                      <option value="">Pilih jenis produk</option>
                      {revenueOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={dataProductStyles.helpText}>
                      Pilihan ini berasal dari mapping global Produksi Barang
                      Jadi.
                    </p>
                  </div>

                  <div className={dataProductStyles.fieldGroup}>
                    <Label
                      htmlFor="unitOfMeasure"
                      className={dataProductStyles.label}
                    >
                      Satuan
                    </Label>
                    <Input
                      id="unitOfMeasure"
                      name="unitOfMeasure"
                      placeholder="Contoh: rak, kg, kantong, porsi"
                      defaultValue="unit"
                      required
                    />
                  </div>

                  <div className={dataProductStyles.fieldGroup}>
                    <Label
                      htmlFor="defaultSellingPrice"
                      className={dataProductStyles.label}
                    >
                      Harga Jual Default
                    </Label>
                    <Input
                      id="defaultSellingPrice"
                      name="defaultSellingPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue="0"
                    />
                    <p className={dataProductStyles.helpText}>
                      Boleh 0 jika harga belum ditentukan.
                    </p>
                  </div>

                  <div className={dataProductStyles.fieldGroup}>
                    <Label
                      htmlFor="description"
                      className={dataProductStyles.label}
                    >
                      Keterangan
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Catatan produk, ukuran, kemasan, atau spesifikasi."
                    />
                  </div>

                  <div className={dataProductStyles.actions}>
                    <Button type="submit">Simpan Produk</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Konteks Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={dataProductStyles.contextList}>
                  <div className={dataProductStyles.contextItem}>
                    <p className={dataProductStyles.contextLabel}>BUMDes</p>
                    <p className={dataProductStyles.contextValue}>
                      {context.bumDesaName}
                    </p>
                  </div>
                  <div className={dataProductStyles.contextItem}>
                    <p className={dataProductStyles.contextLabel}>Unit Usaha</p>
                    <p className={dataProductStyles.contextValue}>
                      {context.unitUsahaName}
                    </p>
                  </div>
                  <div className={dataProductStyles.contextItem}>
                    <p className={dataProductStyles.contextLabel}>
                      Kategori Bisnis
                    </p>
                    <p className={dataProductStyles.contextValue}>
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
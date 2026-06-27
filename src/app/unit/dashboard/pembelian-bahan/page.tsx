import Link from "next/link";
import { ArrowLeft, CheckCircle2, PackagePlus, Truck } from "lucide-react";
import { createMaterialPurchaseAction } from "@/app/unit/dashboard/pembelian-bahan/actions";
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
  getMaterialPurchaseHistoryList,
  getMaterialPurchaseMaterialOptions,
  getMaterialPurchaseSupplierOptions,
} from "@/lib/unit/get-material-purchase-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type MaterialPurchasePageProps = {
  searchParams: Promise<{
    created?: string;
    mode?: string;
    materialId?: string;
  }>;
};

const purchasePageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  topBar:
    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  successIcon: "h-4 w-4",
  actionGroup: "flex flex-col gap-2 sm:flex-row sm:items-center",
  primaryAction:
    "inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800",
  secondaryAction:
    "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50",
  summaryGrid: "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
  summaryBox: "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
  summaryLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  summaryValue: "mt-2 break-words text-xl font-semibold text-slate-950",
  summaryHelp: "mt-1 text-sm leading-6 text-slate-500",
  cleanGrid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
  sectionCard: "min-w-0 overflow-hidden border-slate-200",
  sectionHeader:
    "border-b border-slate-100 bg-white px-5 py-4 sm:px-6",
  sectionTitle: "text-base font-semibold text-slate-950",
  sectionDescription: "mt-1 text-sm leading-6 text-slate-600",
  materialGrid: "grid gap-3 md:grid-cols-2",
  materialOption:
    "block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
  materialOptionActive:
    "block rounded-xl border border-slate-950 bg-slate-50 p-4 shadow-sm",
  materialOptionTitle: "font-semibold text-slate-950",
  materialOptionMeta: "mt-1 text-sm leading-6 text-slate-600",
  materialStats: "mt-3 grid gap-2 sm:grid-cols-3",
  smallStat: "rounded-lg border border-slate-200 bg-white px-3 py-2",
  smallStatLabel: "text-[11px] font-medium uppercase tracking-wide text-slate-500",
  smallStatValue: "mt-1 break-words text-sm font-semibold text-slate-950",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600",
  form: "space-y-5",
  formSection: "rounded-xl border border-slate-200 bg-white p-4",
  formSectionTitle: "text-sm font-semibold text-slate-950",
  twoCols: "mt-4 grid gap-3 sm:grid-cols-2",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  helpText: "text-xs leading-5 text-slate-500",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
  details:
    "mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4",
  detailsSummary:
    "cursor-pointer text-sm font-semibold text-slate-800",
  actions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  sideColumn: "min-w-0 space-y-6",
  historyCard: "min-w-0 overflow-hidden",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "w-full table-fixed divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "break-words px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "break-words px-4 py-3 align-top text-slate-700",
  tableCellStrong:
    "break-words px-4 py-3 align-top font-semibold text-slate-950",
  emptyState:
    "rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center",
  emptyIcon:
    "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600",
  emptyTitle: "mt-4 text-base font-semibold text-slate-950",
  emptyDescription: "mt-2 text-sm leading-6 text-slate-600",
};

function formatDecimal(value: string | number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(numberValue);
}

function formatCurrency(value: string | number) {
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

function getPaymentStatusLabel(value: string) {
  if (value === "PAID") {
    return "Lunas";
  }

  if (value === "UNPAID") {
    return "Belum lunas";
  }

  if (value === "PARTIAL") {
    return "Sebagian";
  }

  return value;
}

export default async function MaterialPurchasePage({
  searchParams,
}: MaterialPurchasePageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  const [materials, suppliers, purchases] = await Promise.all([
    getMaterialPurchaseMaterialOptions(context),
    getMaterialPurchaseSupplierOptions(context),
    getMaterialPurchaseHistoryList(context),
  ]);

  const createdPurchase = params.created;
  const isCreateMode = params.mode === "create";
  const selectedMaterialId = params.materialId;
  const selectedMaterial = selectedMaterialId
    ? materials.find((material) => material.materialId === selectedMaterialId)
    : null;
  const today = getTodayInputValue();

  const totalMaterialStockValue = materials.reduce((total, material) => {
    const value = Number(material.totalValue);
    return Number.isFinite(value) ? total + value : total;
  }, 0);

  const latestPurchase = purchases[0];

  return (
    <PageContainer>
      <div className={purchasePageStyles.topBar}>
        <Link href="/unit/dashboard" className={purchasePageStyles.backLink}>
          <ArrowLeft className={purchasePageStyles.backIcon} />
          Kembali ke Dashboard Unit
        </Link>

        <div className={purchasePageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/produksi/stok-bahan"
            className={purchasePageStyles.secondaryAction}
          >
            Lihat Stok Bahan
          </Link>
          {isCreateMode ? (
            <Link
              href="/unit/dashboard/pembelian-bahan"
              className={purchasePageStyles.secondaryAction}
            >
              Tutup Form
            </Link>
          ) : (
            <Link
              href="/unit/dashboard/pembelian-bahan?mode=create"
              className={purchasePageStyles.primaryAction}
            >
              Catat Pembelian
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title="Pembelian Bahan"
        description="Kelola pembelian bahan produksi. Sistem menambah stok bahan, mencatat utang supplier untuk pembelian kredit, dan membuat jurnal otomatis."
      />

      <div className={purchasePageStyles.content}>
        {createdPurchase ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={purchasePageStyles.successIcon} />
                Pembelian berhasil dicatat
              </span>
            </AlertTitle>
            <AlertDescription>{createdPurchase}</AlertDescription>
          </Alert>
        ) : null}

        <div className={purchasePageStyles.summaryGrid}>
          <div className={purchasePageStyles.summaryBox}>
            <p className={purchasePageStyles.summaryLabel}>Bahan aktif</p>
            <p className={purchasePageStyles.summaryValue}>
              {materials.length} bahan
            </p>
            <p className={purchasePageStyles.summaryHelp}>
              Bahan produksi yang bisa dibeli dan masuk stok.
            </p>
          </div>

          <div className={purchasePageStyles.summaryBox}>
            <p className={purchasePageStyles.summaryLabel}>Supplier aktif</p>
            <p className={purchasePageStyles.summaryValue}>
              {suppliers.length} supplier
            </p>
            <p className={purchasePageStyles.summaryHelp}>
              Supplier bisa dipilih atau dibuat saat transaksi.
            </p>
          </div>

          <div className={purchasePageStyles.summaryBox}>
            <p className={purchasePageStyles.summaryLabel}>Nilai stok bahan</p>
            <p className={purchasePageStyles.summaryValue}>
              {formatCurrency(totalMaterialStockValue)}
            </p>
            <p className={purchasePageStyles.summaryHelp}>
              Berdasarkan mutasi masuk dan keluar bahan.
            </p>
          </div>

          <div className={purchasePageStyles.summaryBox}>
            <p className={purchasePageStyles.summaryLabel}>Transaksi terakhir</p>
            <p className={purchasePageStyles.summaryValue}>
              {latestPurchase ? latestPurchase.code : "Belum ada"}
            </p>
            <p className={purchasePageStyles.summaryHelp}>
              {latestPurchase
                ? `${getPaymentMethodLabel(
                    latestPurchase.paymentMethod
                  )} - ${formatCurrency(latestPurchase.totalPurchaseAmount)}`
                : "Belum ada riwayat pembelian bahan."}
            </p>
          </div>
        </div>

        {isCreateMode ? (
          <div className={purchasePageStyles.cleanGrid}>
            <Card className={purchasePageStyles.sectionCard}>
              <CardHeader className={purchasePageStyles.sectionHeader}>
                <CardTitle className={purchasePageStyles.sectionTitle}>
                  {selectedMaterial ? "Form Pembelian" : "Pilih Bahan"}
                </CardTitle>
                <p className={purchasePageStyles.sectionDescription}>
                  {selectedMaterial
                    ? "Lengkapi data pembelian untuk satu bahan yang dipilih."
                    : "Pilih satu bahan terlebih dahulu agar form tetap ringkas dan fokus."}
                </p>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                {!selectedMaterial ? (
                  materials.length > 0 ? (
                    <div className={purchasePageStyles.materialGrid}>
                      {materials.map((material) => (
                        <Link
                          key={material.materialId}
                          href={`/unit/dashboard/pembelian-bahan?mode=create&materialId=${encodeURIComponent(
                            material.materialId
                          )}`}
                          className={purchasePageStyles.materialOption}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className={purchasePageStyles.materialOptionTitle}>
                                {material.materialName}
                              </p>
                              <p className={purchasePageStyles.materialOptionMeta}>
                                {material.materialCode} - {material.unitOfMeasure}
                              </p>
                            </div>
                            <span className={purchasePageStyles.badge}>
                              {material.materialType}
                            </span>
                          </div>

                          <div className={purchasePageStyles.materialStats}>
                            <div className={purchasePageStyles.smallStat}>
                              <p className={purchasePageStyles.smallStatLabel}>
                                Stok
                              </p>
                              <p className={purchasePageStyles.smallStatValue}>
                                {formatDecimal(material.quantityOnHand)}
                              </p>
                            </div>
                            <div className={purchasePageStyles.smallStat}>
                              <p className={purchasePageStyles.smallStatLabel}>
                                Nilai
                              </p>
                              <p className={purchasePageStyles.smallStatValue}>
                                {formatCurrency(material.totalValue)}
                              </p>
                            </div>
                            <div className={purchasePageStyles.smallStat}>
                              <p className={purchasePageStyles.smallStatLabel}>
                                Default
                              </p>
                              <p className={purchasePageStyles.smallStatValue}>
                                {formatCurrency(material.defaultUnitCost)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={purchasePageStyles.emptyState}>
                      <div className={purchasePageStyles.emptyIcon}>
                        <PackagePlus className="h-6 w-6" />
                      </div>
                      <h2 className={purchasePageStyles.emptyTitle}>
                        Belum ada bahan produksi
                      </h2>
                      <p className={purchasePageStyles.emptyDescription}>
                        Tambahkan bahan baku terlebih dahulu sebelum mencatat
                        pembelian.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    <Link
                      href="/unit/dashboard/pembelian-bahan?mode=create"
                      className={purchasePageStyles.secondaryAction}
                    >
                      Ganti Bahan
                    </Link>

                    <div className={purchasePageStyles.materialOptionActive}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className={purchasePageStyles.materialOptionTitle}>
                            {selectedMaterial.materialName}
                          </p>
                          <p className={purchasePageStyles.materialOptionMeta}>
                            {selectedMaterial.materialCode} - Satuan:{" "}
                            {selectedMaterial.unitOfMeasure}
                          </p>
                        </div>
                        <span className={purchasePageStyles.badge}>
                          {selectedMaterial.materialType}
                        </span>
                      </div>

                      <div className={purchasePageStyles.materialStats}>
                        <div className={purchasePageStyles.smallStat}>
                          <p className={purchasePageStyles.smallStatLabel}>
                            Stok
                          </p>
                          <p className={purchasePageStyles.smallStatValue}>
                            {formatDecimal(selectedMaterial.quantityOnHand)}{" "}
                            {selectedMaterial.unitOfMeasure}
                          </p>
                        </div>
                        <div className={purchasePageStyles.smallStat}>
                          <p className={purchasePageStyles.smallStatLabel}>
                            Nilai stok
                          </p>
                          <p className={purchasePageStyles.smallStatValue}>
                            {formatCurrency(selectedMaterial.totalValue)}
                          </p>
                        </div>
                        <div className={purchasePageStyles.smallStat}>
                          <p className={purchasePageStyles.smallStatLabel}>
                            Biaya rata-rata
                          </p>
                          <p className={purchasePageStyles.smallStatValue}>
                            {formatCurrency(selectedMaterial.averageUnitCost)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form
                      action={createMaterialPurchaseAction}
                      className={purchasePageStyles.form}
                    >
                      <input
                        type="hidden"
                        name="materialId"
                        value={selectedMaterial.materialId}
                      />

                      <div className={purchasePageStyles.formSection}>
                        <p className={purchasePageStyles.formSectionTitle}>
                          Informasi Transaksi
                        </p>

                        <div className={purchasePageStyles.twoCols}>
                          <div className={purchasePageStyles.fieldGroup}>
                            <Label
                              htmlFor="purchaseDate"
                              className={purchasePageStyles.label}
                            >
                              Tanggal Pembelian
                            </Label>
                            <Input
                              id="purchaseDate"
                              name="purchaseDate"
                              type="date"
                              defaultValue={today}
                            />
                          </div>

                          <div className={purchasePageStyles.fieldGroup}>
                            <Label
                              htmlFor="paymentMethod"
                              className={purchasePageStyles.label}
                            >
                              Metode Pembayaran
                            </Label>
                            <select
                              id="paymentMethod"
                              name="paymentMethod"
                              className={purchasePageStyles.select}
                              defaultValue="CASH"
                            >
                              <option value="CASH">Tunai</option>
                              <option value="CREDIT">Kredit</option>
                            </select>
                            <p className={purchasePageStyles.helpText}>
                              Kredit otomatis membentuk utang supplier.
                            </p>
                          </div>
                        </div>

                        <div className={purchasePageStyles.twoCols}>
                          <div className={purchasePageStyles.fieldGroup}>
                            <Label
                              htmlFor="quantity"
                              className={purchasePageStyles.label}
                            >
                              Jumlah Dibeli
                            </Label>
                            <Input
                              id="quantity"
                              name="quantity"
                              type="number"
                              min="0.0001"
                              step="0.0001"
                              placeholder={`Contoh: 100 ${selectedMaterial.unitOfMeasure}`}
                            />
                          </div>

                          <div className={purchasePageStyles.fieldGroup}>
                            <Label
                              htmlFor="unitCost"
                              className={purchasePageStyles.label}
                            >
                              Harga Satuan
                            </Label>
                            <Input
                              id="unitCost"
                              name="unitCost"
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={Number(
                                selectedMaterial.defaultUnitCost
                              ).toFixed(0)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={purchasePageStyles.formSection}>
                        <p className={purchasePageStyles.formSectionTitle}>
                          Supplier
                        </p>

                        {suppliers.length > 0 ? (
                          <>
                            <div className={purchasePageStyles.twoCols}>
                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="supplierId"
                                  className={purchasePageStyles.label}
                                >
                                  Supplier Terdaftar
                                </Label>
                                <select
                                  id="supplierId"
                                  name="supplierId"
                                  className={purchasePageStyles.select}
                                  defaultValue=""
                                >
                                  <option value="">Buat supplier baru</option>
                                  {suppliers.map((supplier) => (
                                    <option
                                      key={supplier.supplierId}
                                      value={supplier.supplierId}
                                    >
                                      {supplier.supplierName}
                                    </option>
                                  ))}
                                </select>
                                <p className={purchasePageStyles.helpText}>
                                  Pilih supplier lama atau isi supplier baru.
                                </p>
                              </div>

                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="invoiceNumber"
                                  className={purchasePageStyles.label}
                                >
                                  Nomor Faktur/Nota
                                </Label>
                                <Input
                                  id="invoiceNumber"
                                  name="invoiceNumber"
                                  placeholder="Opsional"
                                />
                              </div>
                            </div>

                            <details className={purchasePageStyles.details}>
                              <summary
                                className={purchasePageStyles.detailsSummary}
                              >
                                Isi data supplier baru
                              </summary>

                              <div className={purchasePageStyles.twoCols}>
                                <div className={purchasePageStyles.fieldGroup}>
                                  <Label
                                    htmlFor="newSupplierName"
                                    className={purchasePageStyles.label}
                                  >
                                    Nama Supplier Baru
                                  </Label>
                                  <Input
                                    id="newSupplierName"
                                    name="newSupplierName"
                                    placeholder="Contoh: Toko Pakan Makmur"
                                  />
                                </div>

                                <div className={purchasePageStyles.fieldGroup}>
                                  <Label
                                    htmlFor="newSupplierContactPerson"
                                    className={purchasePageStyles.label}
                                  >
                                    Kontak Supplier Baru
                                  </Label>
                                  <Input
                                    id="newSupplierContactPerson"
                                    name="newSupplierContactPerson"
                                    placeholder="Opsional"
                                  />
                                </div>
                              </div>

                              <div className={purchasePageStyles.twoCols}>
                                <div className={purchasePageStyles.fieldGroup}>
                                  <Label
                                    htmlFor="newSupplierPhone"
                                    className={purchasePageStyles.label}
                                  >
                                    Nomor HP Supplier Baru
                                  </Label>
                                  <Input
                                    id="newSupplierPhone"
                                    name="newSupplierPhone"
                                    placeholder="Opsional"
                                  />
                                </div>

                                <div className={purchasePageStyles.fieldGroup}>
                                  <Label
                                    htmlFor="newSupplierAddress"
                                    className={purchasePageStyles.label}
                                  >
                                    Alamat Supplier Baru
                                  </Label>
                                  <Input
                                    id="newSupplierAddress"
                                    name="newSupplierAddress"
                                    placeholder="Opsional"
                                  />
                                </div>
                              </div>
                            </details>
                          </>
                        ) : (
                          <>
                            <Alert>
                              <AlertTitle>Belum ada supplier</AlertTitle>
                              <AlertDescription>
                                Isi supplier baru untuk transaksi pertama.
                              </AlertDescription>
                            </Alert>

                            <div className={purchasePageStyles.twoCols}>
                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="newSupplierName"
                                  className={purchasePageStyles.label}
                                >
                                  Nama Supplier Baru
                                </Label>
                                <Input
                                  id="newSupplierName"
                                  name="newSupplierName"
                                  placeholder="Contoh: Toko Pakan Makmur"
                                />
                              </div>

                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="invoiceNumber"
                                  className={purchasePageStyles.label}
                                >
                                  Nomor Faktur/Nota
                                </Label>
                                <Input
                                  id="invoiceNumber"
                                  name="invoiceNumber"
                                  placeholder="Opsional"
                                />
                              </div>
                            </div>

                            <div className={purchasePageStyles.twoCols}>
                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="newSupplierContactPerson"
                                  className={purchasePageStyles.label}
                                >
                                  Kontak Supplier Baru
                                </Label>
                                <Input
                                  id="newSupplierContactPerson"
                                  name="newSupplierContactPerson"
                                  placeholder="Opsional"
                                />
                              </div>

                              <div className={purchasePageStyles.fieldGroup}>
                                <Label
                                  htmlFor="newSupplierPhone"
                                  className={purchasePageStyles.label}
                                >
                                  Nomor HP Supplier Baru
                                </Label>
                                <Input
                                  id="newSupplierPhone"
                                  name="newSupplierPhone"
                                  placeholder="Opsional"
                                />
                              </div>
                            </div>

                            <div className={purchasePageStyles.fieldGroup}>
                              <Label
                                htmlFor="newSupplierAddress"
                                className={purchasePageStyles.label}
                              >
                                Alamat Supplier Baru
                              </Label>
                              <Textarea
                                id="newSupplierAddress"
                                name="newSupplierAddress"
                                placeholder="Opsional"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className={purchasePageStyles.formSection}>
                        <p className={purchasePageStyles.formSectionTitle}>
                          Catatan
                        </p>

                        <div className={purchasePageStyles.fieldGroup}>
                          <Label
                            htmlFor="notes"
                            className={purchasePageStyles.label}
                          >
                            Catatan Transaksi
                          </Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Opsional. Contoh: pembelian pakan ayam minggu pertama."
                          />
                        </div>
                      </div>

                      <div className={purchasePageStyles.actions}>
                        <Button type="submit">Simpan Pembelian</Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <div className={purchasePageStyles.sideColumn}>
              <Card className="min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>Panduan Singkat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Alur dibuat dua langkah: pilih bahan terlebih dahulu, lalu
                    isi satu form pembelian.
                  </p>
                  <p>
                    Pembelian tunai memakai T21: persediaan bertambah dan
                    kas/bank berkurang.
                  </p>
                  <p>
                    Pembelian kredit memakai T22: persediaan bertambah dan
                    utang supplier terbentuk.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className={purchasePageStyles.historyCard}>
            <CardHeader>
              <CardTitle>Riwayat Pembelian Bahan</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <div className={purchasePageStyles.tableWrapper}>
                  <div className={purchasePageStyles.tableScroll}>
                    <table className={purchasePageStyles.table}>
                      <thead className={purchasePageStyles.tableHead}>
                        <tr>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Kode
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Tanggal
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Supplier
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Metode
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Total
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Status
                          </th>
                          <th className={purchasePageStyles.tableHeadCell}>
                            Jurnal
                          </th>
                        </tr>
                      </thead>
                      <tbody className={purchasePageStyles.tableBody}>
                        {purchases.map((purchase) => (
                          <tr key={purchase.id}>
                            <td className={purchasePageStyles.tableCellStrong}>
                              {purchase.code}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {purchase.purchaseDate}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {purchase.supplierName}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {getPaymentMethodLabel(purchase.paymentMethod)}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {formatCurrency(purchase.totalPurchaseAmount)}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {getPaymentStatusLabel(purchase.paymentStatus)}
                            </td>
                            <td className={purchasePageStyles.tableCell}>
                              {purchase.journalNumber ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={purchasePageStyles.emptyState}>
                  <div className={purchasePageStyles.emptyIcon}>
                    <Truck className="h-6 w-6" />
                  </div>
                  <h2 className={purchasePageStyles.emptyTitle}>
                    Belum ada pembelian bahan
                  </h2>
                  <p className={purchasePageStyles.emptyDescription}>
                    Klik Catat Pembelian untuk mencatat pembelian bahan produksi
                    pertama.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
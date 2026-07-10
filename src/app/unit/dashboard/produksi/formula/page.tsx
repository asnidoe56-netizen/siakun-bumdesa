import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, PackagePlus } from "lucide-react";
import { createProductionFormulaAction } from "@/app/unit/dashboard/produksi/formula/actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getProductionFormulaList,
  getProductionFormulaMaterialOptions,
  getProductionFormulaProductOptions,
} from "@/lib/unit/get-production-formula-data";
import { getProductionMaterialTypeLabel } from "@/lib/unit/get-production-material-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type ProductionFormulaPageProps = {
  searchParams: Promise<{
    created?: string;
    mode?: string;
  }>;
};

const formulaLineSlots = [1, 2, 3, 4, 5] as const;

const formulaPageStyles = {
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
  formGrid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
  sideColumn: "min-w-0 space-y-6",
  sectionCard: "min-w-0 overflow-hidden border-slate-200",
  sectionHeader:
    "border-b border-slate-100 bg-white px-5 py-4 sm:px-6",
  sectionTitle: "text-base font-semibold text-slate-950",
  sectionDescription: "mt-1 text-sm leading-6 text-slate-600",
  form: "space-y-5",
  formSection: "rounded-xl border border-slate-200 bg-white p-4",
  formSectionTitle: "text-sm font-semibold text-slate-950",
  formSectionDescription: "mt-1 text-xs leading-5 text-slate-500",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helpText: "text-xs leading-5 text-slate-500",
  lineGrid: "mt-4 grid gap-4 lg:grid-cols-2",
  lineBox: "space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4",
  lineTitle: "text-sm font-semibold text-slate-900",
  twoCols: "mt-4 grid gap-3 sm:grid-cols-2",
  checkboxRow:
    "flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3",
  checkbox: "mt-1 h-4 w-4 rounded border-slate-300",
  actions:
    "flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end",
  contextList: "min-w-0 space-y-3 text-sm",
  contextItem: "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
  contextLabel: "text-xs font-medium uppercase tracking-wide text-slate-500",
  contextValue: "mt-1 break-words font-semibold text-slate-900",
  historyCard: "min-w-0 overflow-hidden",
  tableWrapper: "overflow-hidden rounded-xl border border-slate-200 bg-white",
  tableScroll: "w-full overflow-x-auto lg:overflow-x-visible",
  table: "min-w-[780px] w-full divide-y divide-slate-200 text-sm",
  tableHead: "bg-slate-50",
  tableHeadCell:
    "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  tableBody: "divide-y divide-slate-100 bg-white",
  tableCell: "whitespace-nowrap px-4 py-3 text-slate-700",
  tableCellStrong: "whitespace-nowrap px-4 py-3 font-semibold text-slate-950",
  badge:
    "inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600",
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

export default async function ProductionFormulaPage({
  searchParams,
}: ProductionFormulaPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Formula Produksi Tidak Tersedia"
        description="Formula atau resep produksi hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const [formulas, products, materials] = await Promise.all([
    getProductionFormulaList(context),
    getProductionFormulaProductOptions(context),
    getProductionFormulaMaterialOptions(context),
  ]);

  const createdFormula = params.created;
  const isCreateMode = params.mode === "create";
  const canCreateFormula = products.length > 0 && materials.length > 0;

  const productWithFormulaCount = new Set(
    formulas.map((formula) => formula.productName)
  ).size;
  const activeDefaultFormulaCount = formulas.filter(
    (formula) => formula.isDefault && formula.isActive
  ).length;
  const relatedMaterialCount = formulas.reduce(
    (total, formula) => total + formula.materialCount,
    0
  );

  return (
    <PageContainer>
      <div className={formulaPageStyles.topBar}>
        <Link href="/unit/dashboard/produksi" className={formulaPageStyles.backLink}>
          <ArrowLeft className={formulaPageStyles.backIcon} />
          Kembali ke Produksi
        </Link>

        <div className={formulaPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/produksi/data-produk"
            className={formulaPageStyles.secondaryAction}
          >
            Lihat Produk
          </Link>
          {isCreateMode ? (
            <Link
              href="/unit/dashboard/produksi/formula"
              className={formulaPageStyles.secondaryAction}
            >
              Tutup Form
            </Link>
          ) : (
            <Link
              href="/unit/dashboard/produksi/formula?mode=create"
              className={formulaPageStyles.primaryAction}
            >
              Tambah Resep
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title="Formula / Resep Produksi"
        description="Kelola standar bahan, komposisi, dan output produksi untuk setiap produk jadi."
      />

      <div className={formulaPageStyles.content}>
        {createdFormula ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={formulaPageStyles.successIcon} />
                Resep berhasil ditambahkan
              </span>
            </AlertTitle>
            <AlertDescription>{createdFormula}</AlertDescription>
          </Alert>
        ) : null}

        {!canCreateFormula ? (
          <Alert>
            <AlertTitle>Data produk dan bahan belum lengkap</AlertTitle>
            <AlertDescription>
              Tambahkan minimal satu produk jadi dan satu bahan baku/komponen
              sebelum membuat resep produksi.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className={formulaPageStyles.summaryGrid}>
          <div className={formulaPageStyles.summaryBox}>
            <p className={formulaPageStyles.summaryLabel}>Total resep</p>
            <p className={formulaPageStyles.summaryValue}>
              {formulas.length} resep
            </p>
            <p className={formulaPageStyles.summaryHelp}>
              Standar produksi yang sudah dibuat.
            </p>
          </div>

          <div className={formulaPageStyles.summaryBox}>
            <p className={formulaPageStyles.summaryLabel}>Produk dengan resep</p>
            <p className={formulaPageStyles.summaryValue}>
              {productWithFormulaCount} produk
            </p>
            <p className={formulaPageStyles.summaryHelp}>
              Produk jadi yang sudah memiliki formula.
            </p>
          </div>

          <div className={formulaPageStyles.summaryBox}>
            <p className={formulaPageStyles.summaryLabel}>Resep default</p>
            <p className={formulaPageStyles.summaryValue}>
              {activeDefaultFormulaCount} aktif
            </p>
            <p className={formulaPageStyles.summaryHelp}>
              Resep utama yang digunakan saat produksi.
            </p>
          </div>

          <div className={formulaPageStyles.summaryBox}>
            <p className={formulaPageStyles.summaryLabel}>Bahan terkait</p>
            <p className={formulaPageStyles.summaryValue}>
              {relatedMaterialCount} bahan
            </p>
            <p className={formulaPageStyles.summaryHelp}>
              Komponen bahan yang digunakan dalam resep.
            </p>
          </div>
        </div>

        {isCreateMode ? (
          <div className={formulaPageStyles.formGrid}>
            <Card className={formulaPageStyles.sectionCard}>
              <CardHeader className={formulaPageStyles.sectionHeader}>
                <CardTitle className={formulaPageStyles.sectionTitle}>
                  Tambah Resep Produksi
                </CardTitle>
                <p className={formulaPageStyles.sectionDescription}>
                  Lengkapi informasi produk jadi dan bahan yang dibutuhkan untuk
                  membuat standar produksi.
                </p>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                <form
                  action={createProductionFormulaAction}
                  className={formulaPageStyles.form}
                >
                  <div className={formulaPageStyles.formSection}>
                    <p className={formulaPageStyles.formSectionTitle}>
                      1. Informasi Produk
                    </p>
                    <p className={formulaPageStyles.formSectionDescription}>
                      Pilih produk jadi, kode resep, nama resep, dan jumlah output
                      yang dihasilkan.
                    </p>

                    <div className="mt-4">
                      <div className={formulaPageStyles.fieldGroup}>
                        <Label htmlFor="productId" className={formulaPageStyles.label}>
                          Produk Jadi
                        </Label>
                        <select
                          id="productId"
                          name="productId"
                          className={formulaPageStyles.select}
                          required
                          disabled={products.length === 0}
                        >
                          <option value="">Pilih produk</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={formulaPageStyles.twoCols}>
                      <div className={formulaPageStyles.fieldGroup}>
                        <Label htmlFor="code" className={formulaPageStyles.label}>
                          Kode Resep
                        </Label>
                        <Input
                          id="code"
                          name="code"
                          placeholder="Contoh: RSP-001"
                          required
                        />
                      </div>

                      <div className={formulaPageStyles.fieldGroup}>
                        <Label
                          htmlFor="outputQuantity"
                          className={formulaPageStyles.label}
                        >
                          Jumlah Output
                        </Label>
                        <Input
                          id="outputQuantity"
                          name="outputQuantity"
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          defaultValue="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className={formulaPageStyles.fieldGroup}>
                        <Label htmlFor="name" className={formulaPageStyles.label}>
                          Nama Resep
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Contoh: Resep Es Kristal Standar"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className={formulaPageStyles.formSection}>
                    <p className={formulaPageStyles.formSectionTitle}>
                      2. Pengaturan Resep
                    </p>
                    <p className={formulaPageStyles.formSectionDescription}>
                      Tambahkan keterangan dan tentukan apakah resep ini menjadi
                      standar utama untuk produk.
                    </p>

                    <div className="mt-4">
                      <div className={formulaPageStyles.fieldGroup}>
                        <Label
                          htmlFor="description"
                          className={formulaPageStyles.label}
                        >
                          Keterangan
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Catatan formula, standar produksi, atau kondisi khusus."
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={formulaPageStyles.checkboxRow}>
                        <input
                          type="checkbox"
                          name="isDefault"
                          className={formulaPageStyles.checkbox}
                        />
                        <span>
                          <span className="block text-sm font-medium text-slate-800">
                            Jadikan resep default untuk produk ini
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Jika dicentang, resep default lama untuk produk yang sama
                            akan digantikan.
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className={formulaPageStyles.formSection}>
                    <p className={formulaPageStyles.formSectionTitle}>
                      3. Bahan / Komponen Resep
                    </p>
                    <p className={formulaPageStyles.formSectionDescription}>
                      Baris pertama wajib diisi. Baris berikutnya opsional untuk
                      komponen tambahan.
                    </p>

                    <div className={formulaPageStyles.lineGrid}>
                      {formulaLineSlots.map((slot) => (
                        <div key={slot} className={formulaPageStyles.lineBox}>
                          <p className={formulaPageStyles.lineTitle}>
                            Bahan {slot}
                          </p>

                          <div className={formulaPageStyles.fieldGroup}>
                            <Label
                              htmlFor={`materialId_${slot}`}
                              className={formulaPageStyles.label}
                            >
                              Bahan / Komponen
                            </Label>
                            <select
                              id={`materialId_${slot}`}
                              name={`materialId_${slot}`}
                              className={formulaPageStyles.select}
                              required={slot === 1}
                              disabled={materials.length === 0}
                            >
                              <option value="">Pilih bahan</option>
                              {materials.map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.name} ({material.code}) -{" "}
                                  {getProductionMaterialTypeLabel(
                                    material.materialType
                                  )}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className={formulaPageStyles.twoCols}>
                            <div className={formulaPageStyles.fieldGroup}>
                              <Label
                                htmlFor={`quantity_${slot}`}
                                className={formulaPageStyles.label}
                              >
                                Jumlah
                              </Label>
                              <Input
                                id={`quantity_${slot}`}
                                name={`quantity_${slot}`}
                                type="number"
                                min="0.0001"
                                step="0.0001"
                                defaultValue={slot === 1 ? "1" : ""}
                                placeholder="0"
                                required={slot === 1}
                              />
                            </div>

                            <div className={formulaPageStyles.fieldGroup}>
                              <Label
                                htmlFor={`wastagePercent_${slot}`}
                                className={formulaPageStyles.label}
                              >
                                Susut %
                              </Label>
                              <Input
                                id={`wastagePercent_${slot}`}
                                name={`wastagePercent_${slot}`}
                                type="number"
                                min="0"
                                max="100"
                                step="0.0001"
                                defaultValue="0"
                              />
                            </div>
                          </div>

                          <div className={formulaPageStyles.fieldGroup}>
                            <Label
                              htmlFor={`notes_${slot}`}
                              className={formulaPageStyles.label}
                            >
                              Catatan Bahan
                            </Label>
                            <Input
                              id={`notes_${slot}`}
                              name={`notes_${slot}`}
                              placeholder="Opsional"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={formulaPageStyles.actions}>
                    <Link
                      href="/unit/dashboard/produksi/formula"
                      className={formulaPageStyles.secondaryAction}
                    >
                      Batal
                    </Link>
                    <button type="reset" className={formulaPageStyles.secondaryAction}>
                      Reset
                    </button>
                    <Button type="submit" disabled={!canCreateFormula}>
                      Simpan Resep
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className={formulaPageStyles.sideColumn}>
              <Card className="min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>Panduan Singkat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Formula digunakan sebagai standar bahan untuk menghasilkan
                    produk jadi.
                  </p>
                  <p>
                    Resep default menjadi acuan utama saat pencatatan produksi
                    dilakukan.
                  </p>
                  <p>
                    Gunakan susut untuk mencatat toleransi bahan yang hilang atau
                    berkurang dalam proses produksi.
                  </p>
                </CardContent>
              </Card>

              <Card className="min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>Konteks Unit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={formulaPageStyles.contextList}>
                    <div className={formulaPageStyles.contextItem}>
                      <p className={formulaPageStyles.contextLabel}>BUMDes</p>
                      <p className={formulaPageStyles.contextValue}>
                        {context.bumDesaName}
                      </p>
                    </div>
                    <div className={formulaPageStyles.contextItem}>
                      <p className={formulaPageStyles.contextLabel}>Unit Usaha</p>
                      <p className={formulaPageStyles.contextValue}>
                        {context.unitUsahaName}
                      </p>
                    </div>
                    <div className={formulaPageStyles.contextItem}>
                      <p className={formulaPageStyles.contextLabel}>
                        Kategori Bisnis
                      </p>
                      <p className={formulaPageStyles.contextValue}>
                        {context.businessCategoryName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className={formulaPageStyles.historyCard}>
            <CardHeader>
              <CardTitle>Daftar Formula / Resep Produksi</CardTitle>
              <p className={formulaPageStyles.sectionDescription}>
                Pantau standar komposisi bahan, output, status default, dan
                status aktif setiap resep produksi.
              </p>
            </CardHeader>
            <CardContent>
              {formulas.length > 0 ? (
                <div className={formulaPageStyles.tableWrapper}>
                  <div className={formulaPageStyles.tableScroll}>
                    <table className={formulaPageStyles.table}>
                      <thead className={formulaPageStyles.tableHead}>
                        <tr>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Kode
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Produk Jadi
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Nama Resep
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Output
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Bahan
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Default
                          </th>
                          <th className={formulaPageStyles.tableHeadCell}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className={formulaPageStyles.tableBody}>
                        {formulas.map((formula) => (
                          <tr key={formula.id}>
                            <td className={formulaPageStyles.tableCellStrong}>
                              {formula.code}
                            </td>
                            <td className={formulaPageStyles.tableCell}>
                              {formula.productName}
                            </td>
                            <td className={formulaPageStyles.tableCellStrong}>
                              {formula.name}
                            </td>
                            <td className={formulaPageStyles.tableCell}>
                              {formatDecimal(formula.outputQuantity)}{" "}
                              {formula.productUnitOfMeasure}
                            </td>
                            <td className={formulaPageStyles.tableCell}>
                              {formula.materialCount} bahan
                            </td>
                            <td className={formulaPageStyles.tableCell}>
                              <span className={formulaPageStyles.badge}>
                                {formula.isDefault ? "Default" : "Alternatif"}
                              </span>
                            </td>
                            <td className={formulaPageStyles.tableCell}>
                              <span className={formulaPageStyles.badge}>
                                {formula.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={formulaPageStyles.emptyState}>
                  <div className={formulaPageStyles.emptyIcon}>
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <h2 className={formulaPageStyles.emptyTitle}>
                    Belum ada resep produksi
                  </h2>
                  <p className={formulaPageStyles.emptyDescription}>
                    Buat resep pertama untuk menetapkan standar bahan,
                    komposisi, dan output produksi.
                  </p>
                  {canCreateFormula ? (
                    <div className="mt-5">
                      <Link
                        href="/unit/dashboard/produksi/formula?mode=create"
                        className={formulaPageStyles.primaryAction}
                      >
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Tambah Resep Pertama
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

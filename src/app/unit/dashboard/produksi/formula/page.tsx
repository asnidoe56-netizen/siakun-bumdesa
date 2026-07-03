import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList } from "lucide-react";
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
  }>;
};

const formulaLineSlots = [1, 2, 3, 4, 5] as const;

const formulaPageStyles = {
  content: "mt-6 w-full min-w-0 space-y-6",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950",
  backIcon: "h-4 w-4",
  successIcon: "h-4 w-4",
  grid: "grid w-full min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]",
  form: "w-full min-w-0 space-y-5",
  fieldGroup: "min-w-0 space-y-2",
  label: "text-sm font-medium text-slate-700",
  select:
    "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50",
  helpText: "text-xs leading-5 text-slate-500",
  lineBox: "space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4",
  lineTitle: "text-sm font-semibold text-slate-900",
  twoCols: "grid gap-3 sm:grid-cols-2",
  checkboxRow:
    "flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3",
  checkbox: "mt-1 h-4 w-4 rounded border-slate-300",
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
  const canCreateFormula = products.length > 0 && materials.length > 0;

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={formulaPageStyles.backLink}>
        <ArrowLeft className={formulaPageStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Formula / Resep Produksi"
        description="Tentukan standar bahan dan komponen yang dibutuhkan untuk menghasilkan produk jadi."
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

        <div className={formulaPageStyles.grid}>
          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Daftar Formula / Resep</CardTitle>
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
                              Resep
                            </th>
                            <th className={formulaPageStyles.tableHeadCell}>
                              Produk
                            </th>
                            <th className={formulaPageStyles.tableHeadCell}>
                              Output
                            </th>
                            <th className={formulaPageStyles.tableHeadCell}>
                              Bahan
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
                              <td className={formulaPageStyles.tableCellStrong}>
                                <div className="space-y-1">
                                  <p>{formula.name}</p>
                                  {formula.isDefault ? (
                                    <span className={formulaPageStyles.badge}>
                                      Default
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className={formulaPageStyles.tableCell}>
                                {formula.productName}
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
                      Buat resep pertama untuk menentukan standar bahan yang
                      dipakai dalam menghasilkan produk.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Tambah Resep</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={createProductionFormulaAction}
                  className={formulaPageStyles.form}
                >
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

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Bahan / Komponen Resep
                      </h3>
                      <p className={formulaPageStyles.helpText}>
                        Baris pertama wajib diisi. Baris berikutnya opsional.
                      </p>
                    </div>

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

                  <div className={formulaPageStyles.actions}>
                    <Button type="submit" disabled={!canCreateFormula}>
                      Simpan Resep
                    </Button>
                  </div>
                </form>
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
      </div>
    </PageContainer>
  );
}
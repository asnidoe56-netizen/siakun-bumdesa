import Link from "next/link";
import { ArrowLeft, CheckCircle2, Wheat } from "lucide-react";
import { createProductionMaterialAction } from "@/app/unit/dashboard/produksi/bahan-baku/actions";
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
  getProductionMaterialList,
  getProductionMaterialTypeLabel,
  productionMaterialTypeOptions,
} from "@/lib/unit/get-production-material-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type ProductionMaterialPageProps = {
  searchParams: Promise<{
    created?: string;
  }>;
};

const materialPageStyles = {
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

export default async function ProductionMaterialPage({
  searchParams,
}: ProductionMaterialPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  if (
    context.unitType !== "unit_usaha" ||
    context.businessCategoryCode !== "PRODUKSI_BARANG_JADI"
  ) {
    return (
      <UnitContextBlocker
        context={context}
        title="Data Bahan Produksi Tidak Tersedia"
        description="Data bahan baku dan komponen produksi hanya tersedia untuk unit usaha kategori Produksi Barang Jadi."
        expectedContext="Unit Usaha kategori Produksi Barang Jadi"
      />
    );
  }

  const materials = await getProductionMaterialList(context);
  const createdMaterial = params.created;

  return (
    <PageContainer>
      <Link href="/unit/dashboard/produksi" className={materialPageStyles.backLink}>
        <ArrowLeft className={materialPageStyles.backIcon} />
        Kembali ke Produksi
      </Link>

      <PageHeader
        title="Bahan Baku / Komponen"
        description="Kelola bahan baku dan komponen produksi per unit, seperti pakan, vitamin, kemasan, air, atau bahan pendukung."
      />

      <div className={materialPageStyles.content}>
        {createdMaterial ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={materialPageStyles.successIcon} />
                Bahan berhasil ditambahkan
              </span>
            </AlertTitle>
            <AlertDescription>{createdMaterial}</AlertDescription>
          </Alert>
        ) : null}

        <div className={materialPageStyles.grid}>
          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Daftar Bahan / Komponen</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className={materialPageStyles.tableWrapper}>
                    <div className={materialPageStyles.tableScroll}>
                      <table className={materialPageStyles.table}>
                        <thead className={materialPageStyles.tableHead}>
                          <tr>
                            <th className={materialPageStyles.tableHeadCell}>
                              Kode
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Bahan
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Jenis
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Satuan
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Harga Default
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Stok
                            </th>
                            <th className={materialPageStyles.tableHeadCell}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className={materialPageStyles.tableBody}>
                          {materials.map((material) => (
                            <tr key={material.id}>
                              <td className={materialPageStyles.tableCellStrong}>
                                {material.code}
                              </td>
                              <td className={materialPageStyles.tableCellStrong}>
                                {material.name}
                              </td>
                              <td className={materialPageStyles.tableCell}>
                                {getProductionMaterialTypeLabel(
                                  material.materialType
                                )}
                              </td>
                              <td className={materialPageStyles.tableCell}>
                                {material.unitOfMeasure}
                              </td>
                              <td className={materialPageStyles.tableCell}>
                                {formatCurrency(material.defaultUnitCost)}
                              </td>
                              <td className={materialPageStyles.tableCell}>
                                <span className={materialPageStyles.badge}>
                                  {material.isStocked
                                    ? "Dipantau"
                                    : "Tidak dipantau"}
                                </span>
                              </td>
                              <td className={materialPageStyles.tableCell}>
                                <span className={materialPageStyles.badge}>
                                  {material.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={materialPageStyles.emptyState}>
                    <div className={materialPageStyles.emptyIcon}>
                      <Wheat className="h-6 w-6" />
                    </div>
                    <h2 className={materialPageStyles.emptyTitle}>
                      Belum ada bahan baku
                    </h2>
                    <p className={materialPageStyles.emptyDescription}>
                      Tambahkan bahan pertama, misalnya Pakan, Vitamin, Tray
                      Telur, Air, Plastik Kemasan, atau bahan pendukung lain.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Tambah Bahan</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  action={createProductionMaterialAction}
                  className={materialPageStyles.form}
                >
                  <div className={materialPageStyles.fieldGroup}>
                    <Label htmlFor="code" className={materialPageStyles.label}>
                      Kode Bahan
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      placeholder="Contoh: PAKAN-001"
                      required
                    />
                    <p className={materialPageStyles.helpText}>
                      Kode akan disimpan sebagai huruf besar.
                    </p>
                  </div>

                  <div className={materialPageStyles.fieldGroup}>
                    <Label htmlFor="name" className={materialPageStyles.label}>
                      Nama Bahan
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Contoh: Pakan Ayam"
                      required
                    />
                  </div>

                  <div className={materialPageStyles.fieldGroup}>
                    <Label
                      htmlFor="materialType"
                      className={materialPageStyles.label}
                    >
                      Jenis Bahan
                    </Label>
                    <select
                      id="materialType"
                      name="materialType"
                      className={materialPageStyles.select}
                      required
                    >
                      {productionMaterialTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className={materialPageStyles.helpText}>
                      Pilih jenis bahan sesuai fungsi dalam proses produksi.
                    </p>
                  </div>

                  <div className={materialPageStyles.fieldGroup}>
                    <Label
                      htmlFor="unitOfMeasure"
                      className={materialPageStyles.label}
                    >
                      Satuan
                    </Label>
                    <Input
                      id="unitOfMeasure"
                      name="unitOfMeasure"
                      placeholder="Contoh: kg, sak, liter, pcs"
                      defaultValue="unit"
                      required
                    />
                  </div>

                  <div className={materialPageStyles.fieldGroup}>
                    <Label
                      htmlFor="defaultUnitCost"
                      className={materialPageStyles.label}
                    >
                      Harga Satuan Default
                    </Label>
                    <Input
                      id="defaultUnitCost"
                      name="defaultUnitCost"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue="0"
                    />
                    <p className={materialPageStyles.helpText}>
                      Boleh 0 jika harga belum ditentukan.
                    </p>
                  </div>

                  <label className={materialPageStyles.checkboxRow}>
                    <input
                      type="checkbox"
                      name="isStocked"
                      className={materialPageStyles.checkbox}
                      defaultChecked
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        Pantau stok bahan ini
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Nonaktifkan jika bahan ini hanya biaya pendukung dan
                        tidak perlu stok fisik.
                      </span>
                    </span>
                  </label>

                  <div className={materialPageStyles.fieldGroup}>
                    <Label
                      htmlFor="description"
                      className={materialPageStyles.label}
                    >
                      Keterangan
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Catatan bahan, merek, ukuran, atau spesifikasi."
                    />
                  </div>

                  <div className={materialPageStyles.actions}>
                    <Button type="submit">Simpan Bahan</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Konteks Unit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={materialPageStyles.contextList}>
                  <div className={materialPageStyles.contextItem}>
                    <p className={materialPageStyles.contextLabel}>BUMDes</p>
                    <p className={materialPageStyles.contextValue}>
                      {context.bumDesaName}
                    </p>
                  </div>
                  <div className={materialPageStyles.contextItem}>
                    <p className={materialPageStyles.contextLabel}>Unit Usaha</p>
                    <p className={materialPageStyles.contextValue}>
                      {context.unitUsahaName}
                    </p>
                  </div>
                  <div className={materialPageStyles.contextItem}>
                    <p className={materialPageStyles.contextLabel}>
                      Kategori Bisnis
                    </p>
                    <p className={materialPageStyles.contextValue}>
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
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDollarSign, ReceiptText } from "lucide-react";
import { createSupplierPaymentAction } from "@/app/unit/dashboard/pelunasan-utang-supplier/actions";
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
  getOpenSupplierPayableOptions,
  getSupplierPaymentHistoryList,
} from "@/lib/unit/get-supplier-payment-data";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";

export const dynamic = "force-dynamic";

type SupplierPaymentPageProps = {
  searchParams: Promise<{
    created?: string;
    mode?: string;
    payableId?: string;
  }>;
};

const paymentPageStyles = {
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
  payableGrid: "grid gap-3 md:grid-cols-2",
  payableOption:
    "block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50",
  payableOptionActive:
    "block rounded-xl border border-slate-950 bg-slate-50 p-4 shadow-sm",
  payableTitle: "font-semibold text-slate-950",
  payableMeta: "mt-1 text-sm leading-6 text-slate-600",
  payableStats: "mt-3 grid gap-2 sm:grid-cols-3",
  smallStat: "rounded-lg border border-slate-200 bg-white px-3 py-2",
  smallStatLabel:
    "text-[11px] font-medium uppercase tracking-wide text-slate-500",
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

function getPayableStatusLabel(value: string) {
  if (value === "UNPAID") {
    return "Belum lunas";
  }

  if (value === "PARTIAL") {
    return "Sebagian";
  }

  if (value === "PAID") {
    return "Lunas";
  }

  return value;
}

function getPaymentMethodLabel(value: string) {
  if (value === "CASH") {
    return "Tunai";
  }

  if (value === "BANK_TRANSFER") {
    return "Transfer Bank";
  }

  return value;
}

export default async function SupplierPaymentPage({
  searchParams,
}: SupplierPaymentPageProps) {
  const params = await searchParams;
  const context = await getUnitWorkContext();

  const [payables, payments] = await Promise.all([
    getOpenSupplierPayableOptions(context),
    getSupplierPaymentHistoryList(context),
  ]);

  const createdPayment = params.created;
  const isCreateMode = params.mode === "create";
  const selectedPayableId = params.payableId;
  const selectedPayable = selectedPayableId
    ? payables.find((payable) => payable.payableId === selectedPayableId)
    : null;
  const today = getTodayInputValue();

  const totalOutstanding = payables.reduce((total, payable) => {
    const value = Number(payable.outstandingAmount);
    return Number.isFinite(value) ? total + value : total;
  }, 0);

  const latestPayment = payments[0];

  return (
    <PageContainer>
      <div className={paymentPageStyles.topBar}>
        <Link href="/unit/dashboard" className={paymentPageStyles.backLink}>
          <ArrowLeft className={paymentPageStyles.backIcon} />
          Kembali ke Dashboard Unit
        </Link>

        <div className={paymentPageStyles.actionGroup}>
          <Link
            href="/unit/dashboard/pembelian-bahan"
            className={paymentPageStyles.secondaryAction}
          >
            Lihat Pembelian Bahan
          </Link>
          {isCreateMode ? (
            <Link
              href="/unit/dashboard/pelunasan-utang-supplier"
              className={paymentPageStyles.secondaryAction}
            >
              Tutup Form
            </Link>
          ) : (
            <Link
              href="/unit/dashboard/pelunasan-utang-supplier?mode=create"
              className={paymentPageStyles.primaryAction}
            >
              Bayar Utang
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title="Pelunasan Utang Supplier"
        description="Bayar utang usaha yang terbentuk dari pembelian bahan kredit. Sistem mengurangi utang, mengurangi kas, dan membuat jurnal otomatis."
      />

      <div className={paymentPageStyles.content}>
        {createdPayment ? (
          <Alert variant="success">
            <AlertTitle>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className={paymentPageStyles.successIcon} />
                Pembayaran utang berhasil dicatat
              </span>
            </AlertTitle>
            <AlertDescription>{createdPayment}</AlertDescription>
          </Alert>
        ) : null}

        <div className={paymentPageStyles.summaryGrid}>
          <div className={paymentPageStyles.summaryBox}>
            <p className={paymentPageStyles.summaryLabel}>Utang terbuka</p>
            <p className={paymentPageStyles.summaryValue}>
              {payables.length} utang
            </p>
            <p className={paymentPageStyles.summaryHelp}>
              Daftar utang supplier yang belum lunas.
            </p>
          </div>

          <div className={paymentPageStyles.summaryBox}>
            <p className={paymentPageStyles.summaryLabel}>Total sisa utang</p>
            <p className={paymentPageStyles.summaryValue}>
              {formatCurrency(totalOutstanding)}
            </p>
            <p className={paymentPageStyles.summaryHelp}>
              Akumulasi outstanding utang supplier terbuka.
            </p>
          </div>

          <div className={paymentPageStyles.summaryBox}>
            <p className={paymentPageStyles.summaryLabel}>Riwayat pembayaran</p>
            <p className={paymentPageStyles.summaryValue}>
              {payments.length} transaksi
            </p>
            <p className={paymentPageStyles.summaryHelp}>
              Menampilkan maksimal 30 pembayaran terbaru.
            </p>
          </div>

          <div className={paymentPageStyles.summaryBox}>
            <p className={paymentPageStyles.summaryLabel}>Pembayaran terakhir</p>
            <p className={paymentPageStyles.summaryValue}>
              {latestPayment ? latestPayment.paymentCode : "Belum ada"}
            </p>
            <p className={paymentPageStyles.summaryHelp}>
              {latestPayment
                ? `${latestPayment.supplierName} - ${formatCurrency(
                    latestPayment.totalPaymentAmount
                  )}`
                : "Belum ada pembayaran supplier."}
            </p>
          </div>
        </div>

        {isCreateMode ? (
          <div className={paymentPageStyles.cleanGrid}>
            <Card className={paymentPageStyles.sectionCard}>
              <CardHeader className={paymentPageStyles.sectionHeader}>
                <CardTitle className={paymentPageStyles.sectionTitle}>
                  {selectedPayable ? "Form Pembayaran" : "Pilih Utang"}
                </CardTitle>
                <p className={paymentPageStyles.sectionDescription}>
                  {selectedPayable
                    ? "Lengkapi pembayaran untuk satu utang supplier."
                    : "Pilih satu utang terbuka agar form pembayaran tetap fokus."}
                </p>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                {!selectedPayable ? (
                  payables.length > 0 ? (
                    <div className={paymentPageStyles.payableGrid}>
                      {payables.map((payable) => (
                        <Link
                          key={payable.payableId}
                          href={`/unit/dashboard/pelunasan-utang-supplier?mode=create&payableId=${encodeURIComponent(
                            payable.payableId
                          )}`}
                          className={paymentPageStyles.payableOption}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className={paymentPageStyles.payableTitle}>
                                {payable.supplierName}
                              </p>
                              <p className={paymentPageStyles.payableMeta}>
                                {payable.payableCode} - Pembelian{" "}
                                {payable.purchaseCode}
                              </p>
                            </div>
                            <span className={paymentPageStyles.badge}>
                              {getPayableStatusLabel(payable.status)}
                            </span>
                          </div>

                          <div className={paymentPageStyles.payableStats}>
                            <div className={paymentPageStyles.smallStat}>
                              <p className={paymentPageStyles.smallStatLabel}>
                                Utang Awal
                              </p>
                              <p className={paymentPageStyles.smallStatValue}>
                                {formatCurrency(payable.originalAmount)}
                              </p>
                            </div>
                            <div className={paymentPageStyles.smallStat}>
                              <p className={paymentPageStyles.smallStatLabel}>
                                Terbayar
                              </p>
                              <p className={paymentPageStyles.smallStatValue}>
                                {formatCurrency(payable.paidAmount)}
                              </p>
                            </div>
                            <div className={paymentPageStyles.smallStat}>
                              <p className={paymentPageStyles.smallStatLabel}>
                                Sisa
                              </p>
                              <p className={paymentPageStyles.smallStatValue}>
                                {formatCurrency(payable.outstandingAmount)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={paymentPageStyles.emptyState}>
                      <div className={paymentPageStyles.emptyIcon}>
                        <ReceiptText className="h-6 w-6" />
                      </div>
                      <h2 className={paymentPageStyles.emptyTitle}>
                        Tidak ada utang terbuka
                      </h2>
                      <p className={paymentPageStyles.emptyDescription}>
                        Utang supplier akan muncul setelah pembelian bahan
                        dicatat dengan metode kredit.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    <Link
                      href="/unit/dashboard/pelunasan-utang-supplier?mode=create"
                      className={paymentPageStyles.secondaryAction}
                    >
                      Ganti Utang
                    </Link>

                    <div className={paymentPageStyles.payableOptionActive}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className={paymentPageStyles.payableTitle}>
                            {selectedPayable.supplierName}
                          </p>
                          <p className={paymentPageStyles.payableMeta}>
                            {selectedPayable.payableCode} - Pembelian{" "}
                            {selectedPayable.purchaseCode}
                          </p>
                        </div>
                        <span className={paymentPageStyles.badge}>
                          {getPayableStatusLabel(selectedPayable.status)}
                        </span>
                      </div>

                      <div className={paymentPageStyles.payableStats}>
                        <div className={paymentPageStyles.smallStat}>
                          <p className={paymentPageStyles.smallStatLabel}>
                            Utang Awal
                          </p>
                          <p className={paymentPageStyles.smallStatValue}>
                            {formatCurrency(selectedPayable.originalAmount)}
                          </p>
                        </div>
                        <div className={paymentPageStyles.smallStat}>
                          <p className={paymentPageStyles.smallStatLabel}>
                            Terbayar
                          </p>
                          <p className={paymentPageStyles.smallStatValue}>
                            {formatCurrency(selectedPayable.paidAmount)}
                          </p>
                        </div>
                        <div className={paymentPageStyles.smallStat}>
                          <p className={paymentPageStyles.smallStatLabel}>
                            Sisa
                          </p>
                          <p className={paymentPageStyles.smallStatValue}>
                            {formatCurrency(selectedPayable.outstandingAmount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <form
                      action={createSupplierPaymentAction}
                      className={paymentPageStyles.form}
                    >
                      <input
                        type="hidden"
                        name="payableId"
                        value={selectedPayable.payableId}
                      />

                      <div className={paymentPageStyles.formSection}>
                        <p className={paymentPageStyles.formSectionTitle}>
                          Informasi Pembayaran
                        </p>

                        <div className={paymentPageStyles.twoCols}>
                          <div className={paymentPageStyles.fieldGroup}>
                            <Label
                              htmlFor="paymentDate"
                              className={paymentPageStyles.label}
                            >
                              Tanggal Pembayaran
                            </Label>
                            <Input
                              id="paymentDate"
                              name="paymentDate"
                              type="date"
                              defaultValue={today}
                            />
                          </div>

                          <div className={paymentPageStyles.fieldGroup}>
                            <Label
                              htmlFor="paymentAmount"
                              className={paymentPageStyles.label}
                            >
                              Jumlah Pembayaran
                            </Label>
                            <Input
                              id="paymentAmount"
                              name="paymentAmount"
                              type="number"
                              min="1"
                              step="1"
                              max={Number(selectedPayable.outstandingAmount)}
                              defaultValue={Number(
                                selectedPayable.outstandingAmount
                              ).toFixed(0)}
                            />
                            <p className={paymentPageStyles.helpText}>
                              Maksimal bayar:{" "}
                              {formatCurrency(selectedPayable.outstandingAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={paymentPageStyles.formSection}>
                        <p className={paymentPageStyles.formSectionTitle}>
                          Catatan
                        </p>

                        <div className={paymentPageStyles.fieldGroup}>
                          <Label
                            htmlFor="notes"
                            className={paymentPageStyles.label}
                          >
                            Catatan Pembayaran
                          </Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Opsional. Contoh: pembayaran sebagian utang supplier."
                          />
                        </div>
                      </div>

                      <div className={paymentPageStyles.actions}>
                        <Button type="submit">Simpan Pembayaran</Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            <div className={paymentPageStyles.sideColumn}>
              <Card className="min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>Panduan Singkat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Pembayaran supplier hanya mengambil utang yang masih terbuka
                    dari pembelian bahan kredit.
                  </p>
                  <p>
                    Jurnal memakai T08: debit Utang Usaha dan kredit Kas Tunai.
                  </p>
                  <p>
                    Pembayaran sebagian akan membuat status utang menjadi
                    Sebagian. Jika lunas, status menjadi Lunas.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className={paymentPageStyles.historyCard}>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className={paymentPageStyles.tableWrapper}>
                  <div className={paymentPageStyles.tableScroll}>
                    <table className={paymentPageStyles.table}>
                      <thead className={paymentPageStyles.tableHead}>
                        <tr>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Kode
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Tanggal
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Supplier
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Metode
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Total
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Status
                          </th>
                          <th className={paymentPageStyles.tableHeadCell}>
                            Jurnal
                          </th>
                        </tr>
                      </thead>
                      <tbody className={paymentPageStyles.tableBody}>
                        {payments.map((payment) => (
                          <tr key={payment.paymentId}>
                            <td className={paymentPageStyles.tableCellStrong}>
                              {payment.paymentCode}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {payment.paymentDate}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {payment.supplierName}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {getPaymentMethodLabel(payment.paymentMethod)}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {formatCurrency(payment.totalPaymentAmount)}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {payment.status}
                            </td>
                            <td className={paymentPageStyles.tableCell}>
                              {payment.journalNumber ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className={paymentPageStyles.emptyState}>
                  <div className={paymentPageStyles.emptyIcon}>
                    <CircleDollarSign className="h-6 w-6" />
                  </div>
                  <h2 className={paymentPageStyles.emptyTitle}>
                    Belum ada pembayaran supplier
                  </h2>
                  <p className={paymentPageStyles.emptyDescription}>
                    Klik Bayar Utang untuk mencatat pembayaran utang supplier
                    dari pembelian kredit.
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
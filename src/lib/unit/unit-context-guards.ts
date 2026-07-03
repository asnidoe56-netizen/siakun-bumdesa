import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export function assertCentralOfficeContext(
  context: UnitWorkContext,
  actionLabel = "Transaksi pusat"
) {
  if (context.unitType !== "kantor_pusat") {
    throw new Error(
      `${actionLabel} hanya boleh dicatat dari konteks Kantor Pusat.`
    );
  }
}

export function assertOperationalUnitContext(
  context: UnitWorkContext,
  actionLabel = "Transaksi unit usaha"
) {
  if (context.unitType !== "unit_usaha") {
    throw new Error(
      `${actionLabel} hanya boleh dicatat dari konteks Unit Usaha, bukan Kantor Pusat.`
    );
  }
}

export function assertProductionFinishedGoodsContext(
  context: UnitWorkContext,
  actionLabel = "Transaksi produksi barang jadi"
) {
  assertOperationalUnitContext(context, actionLabel);

  if (context.businessCategoryCode !== "PRODUKSI_BARANG_JADI") {
    throw new Error(
      `${actionLabel} hanya boleh dicatat pada unit usaha kategori Produksi Barang Jadi.`
    );
  }
}

export function assertNonProductionOperationalUnitContext(
  context: UnitWorkContext,
  actionLabel = "Transaksi unit usaha non-produksi"
) {
  assertOperationalUnitContext(context, actionLabel);

  if (context.businessCategoryCode === "PRODUKSI_BARANG_JADI") {
    throw new Error(
      `${actionLabel} tidak boleh dicatat dari unit produksi barang jadi. Gunakan alur khusus produksi agar stok dan HPP tetap akurat.`
    );
  }
}
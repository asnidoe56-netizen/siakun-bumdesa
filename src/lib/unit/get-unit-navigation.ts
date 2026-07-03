export type UnitNavigationIconKey =
  | "dashboard"
  | "factory"
  | "package"
  | "shoppingCart"
  | "clipboardList"
  | "barChart";

export type UnitNavigationItem = {
  label: string;
  href: string;
  iconKey: UnitNavigationIconKey;
};

const defaultUnitNavigation: UnitNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/unit/dashboard",
    iconKey: "dashboard",
  },
  {
    label: "Catat Transaksi",
    href: "/unit/dashboard/catat-transaksi",
    iconKey: "clipboardList",
  },
];

const productionFinishedGoodsNavigation: UnitNavigationItem[] = [
  {
    label: "Dashboard",
    href: "/unit/dashboard",
    iconKey: "dashboard",
  },
  {
    label: "Produksi",
    href: "/unit/dashboard/produksi",
    iconKey: "factory",
  },
  {
    label: "Pembelian Bahan",
    href: "/unit/dashboard/pembelian-bahan",
    iconKey: "clipboardList",
  },
  {
    label: "Utang Supplier",
    href: "/unit/dashboard/pelunasan-utang-supplier",
    iconKey: "clipboardList",
  },
  {
    label: "Barang Jadi",
    href: "/unit/dashboard/barang-jadi",
    iconKey: "package",
  },
  {
    label: "Penjualan Produk",
    href: "/unit/dashboard/penjualan-produk",
    iconKey: "shoppingCart",
  },


];

export function getUnitNavigation(
  businessCategoryCode: string | null | undefined
): UnitNavigationItem[] {
  if (businessCategoryCode === "PRODUKSI_BARANG_JADI") {
    return productionFinishedGoodsNavigation;
  }

  return defaultUnitNavigation;
}
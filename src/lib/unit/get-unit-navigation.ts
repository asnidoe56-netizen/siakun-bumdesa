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
    label: "Barang Jadi",
    href: "/unit/dashboard/barang-jadi",
    iconKey: "package",
  },
  {
    label: "Penjualan Produk",
    href: "/unit/dashboard/penjualan-produk",
    iconKey: "shoppingCart",
  },
  {
    label: "Biaya Produksi",
    href: "/unit/dashboard/biaya-produksi",
    iconKey: "clipboardList",
  },
  {
    label: "Laporan Unit",
    href: "/unit/dashboard/laporan",
    iconKey: "barChart",
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
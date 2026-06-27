import { db } from "@/lib/db/pool";
import type { UnitWorkContext } from "@/lib/unit/get-unit-work-context";

export type MaterialPurchaseSupplierOption = {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
};

export type MaterialPurchaseMaterialOption = {
  materialId: string;
  materialCode: string;
  materialName: string;
  materialType: string;
  unitOfMeasure: string;
  defaultUnitCost: string;
  quantityOnHand: string;
  totalValue: string;
  averageUnitCost: string;
};

export type MaterialPurchaseHistoryItem = {
  id: string;
  code: string;
  purchaseDate: string;
  supplierName: string;
  paymentMethod: string;
  paymentStatus: string;
  totalPurchaseAmount: string;
  status: string;
  journalNumber: string | null;
  payableStatus: string | null;
  outstandingAmount: string;
  lineCount: number;
};

type MaterialPurchaseSupplierOptionRow = {
  supplier_id: string;
  supplier_code: string;
  supplier_name: string;
  contact_person: string | null;
  phone: string | null;
  address: string | null;
};

type MaterialPurchaseMaterialOptionRow = {
  material_id: string;
  material_code: string;
  material_name: string;
  material_type: string;
  unit_of_measure: string;
  default_unit_cost: string;
  quantity_on_hand: string;
  total_value: string;
  average_unit_cost: string;
};

type MaterialPurchaseHistoryRow = {
  id: string;
  code: string;
  purchase_date: string;
  supplier_name: string;
  payment_method: string;
  payment_status: string;
  total_purchase_amount: string;
  status: string;
  journal_number: string | null;
  payable_status: string | null;
  outstanding_amount: string;
  line_count: number;
};

export async function getMaterialPurchaseSupplierOptions(
  context: UnitWorkContext
): Promise<MaterialPurchaseSupplierOption[]> {
  const result = await db.query<MaterialPurchaseSupplierOptionRow>(
    `
      SELECT
        s.id::text AS supplier_id,
        s.code AS supplier_code,
        s.name AS supplier_name,
        s.contact_person,
        s.phone,
        s.address
      FROM supplier s
      WHERE s.bum_desa_id = $1::uuid
        AND s.unit_usaha_id = $2::uuid
        AND s.is_active = TRUE
      ORDER BY s.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    supplierId: row.supplier_id,
    supplierCode: row.supplier_code,
    supplierName: row.supplier_name,
    contactPerson: row.contact_person,
    phone: row.phone,
    address: row.address,
  }));
}

export async function getMaterialPurchaseMaterialOptions(
  context: UnitWorkContext
): Promise<MaterialPurchaseMaterialOption[]> {
  const result = await db.query<MaterialPurchaseMaterialOptionRow>(
    `
      WITH movement_summary AS (
        SELECT
          psm.material_id,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.quantity
              WHEN psm.movement_direction = 'OUT' THEN -psm.quantity
              ELSE 0
            END
          ) AS quantity_on_hand,
          SUM(
            CASE
              WHEN psm.movement_direction = 'IN' THEN psm.total_amount
              WHEN psm.movement_direction = 'OUT' THEN -psm.total_amount
              ELSE 0
            END
          ) AS total_value
        FROM production_stock_movement psm
        WHERE psm.bum_desa_id = $1::uuid
          AND psm.unit_usaha_id = $2::uuid
          AND psm.item_type = 'MATERIAL'
        GROUP BY psm.material_id
      )
      SELECT
        pm.id::text AS material_id,
        pm.code AS material_code,
        pm.name AS material_name,
        pm.material_type,
        pm.unit_of_measure,
        pm.default_unit_cost::text AS default_unit_cost,
        COALESCE(ms.quantity_on_hand, 0)::text AS quantity_on_hand,
        COALESCE(ms.total_value, 0)::text AS total_value,
        CASE
          WHEN COALESCE(ms.quantity_on_hand, 0) > 0
          THEN (COALESCE(ms.total_value, 0) / ms.quantity_on_hand)::numeric(24,6)
          ELSE pm.default_unit_cost::numeric(24,6)
        END::text AS average_unit_cost
      FROM production_material pm
      LEFT JOIN movement_summary ms
        ON ms.material_id = pm.id
      WHERE pm.bum_desa_id = $1::uuid
        AND pm.unit_usaha_id = $2::uuid
        AND pm.is_active = TRUE
      ORDER BY pm.name ASC
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    materialId: row.material_id,
    materialCode: row.material_code,
    materialName: row.material_name,
    materialType: row.material_type,
    unitOfMeasure: row.unit_of_measure,
    defaultUnitCost: row.default_unit_cost,
    quantityOnHand: row.quantity_on_hand,
    totalValue: row.total_value,
    averageUnitCost: row.average_unit_cost,
  }));
}

export async function getMaterialPurchaseHistoryList(
  context: UnitWorkContext
): Promise<MaterialPurchaseHistoryItem[]> {
  const result = await db.query<MaterialPurchaseHistoryRow>(
    `
      SELECT
        mp.id::text AS id,
        mp.code,
        mp.purchase_date::text AS purchase_date,
        s.name AS supplier_name,
        mp.payment_method,
        mp.payment_status,
        mp.total_purchase_amount::text AS total_purchase_amount,
        mp.status,
        jh.nomor_jurnal AS journal_number,
        sp.status AS payable_status,
        COALESCE(sp.outstanding_amount, 0)::text AS outstanding_amount,
        COUNT(mpl.id)::int AS line_count
      FROM material_purchase mp
      JOIN supplier s
        ON s.id = mp.supplier_id
      LEFT JOIN material_purchase_line mpl
        ON mpl.purchase_id = mp.id
      LEFT JOIN supplier_payable sp
        ON sp.purchase_id = mp.id
      LEFT JOIN journal_header jh
        ON jh.id = mp.journal_header_id
      WHERE mp.bum_desa_id = $1::uuid
        AND mp.unit_usaha_id = $2::uuid
      GROUP BY
        mp.id,
        mp.code,
        mp.purchase_date,
        s.name,
        mp.payment_method,
        mp.payment_status,
        mp.total_purchase_amount,
        mp.status,
        jh.nomor_jurnal,
        sp.status,
        sp.outstanding_amount
      ORDER BY mp.purchase_date DESC, mp.created_at DESC
      LIMIT 30
    `,
    [context.bumDesaId, context.unitUsahaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    code: row.code,
    purchaseDate: row.purchase_date,
    supplierName: row.supplier_name,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    totalPurchaseAmount: row.total_purchase_amount,
    status: row.status,
    journalNumber: row.journal_number,
    payableStatus: row.payable_status,
    outstandingAmount: row.outstanding_amount,
    lineCount: row.line_count,
  }));
}
"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/pool";
import { getUnitWorkContext } from "@/lib/unit/get-unit-work-context";
import { assertProductionFinishedGoodsContext } from "@/lib/unit/unit-context-guards";

type FormulaRow = {
  formula_id: string;
  formula_code: string;
  formula_name: string;
  product_id: string;
  product_name: string;
  product_unit_of_measure: string;
  formula_output_quantity: string;
};

type FormulaLineRow = {
  formula_line_id: string;
  material_id: string;
  material_name: string;
  material_unit_of_measure: string;
  formula_quantity: string;
  default_unit_cost: string;
  is_stocked: boolean;
  notes: string | null;
  sort_order: number;
};

type MaterialStockCostRow = {
  quantity_on_hand: string;
  total_value: string;
  average_unit_cost: string | null;
};

function getRequiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi.`);
  }

  return value;
}

function getOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  return value.length > 0 ? value : null;
}

function getPositiveNumber(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "").trim();
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} harus lebih besar dari 0.`);
  }

  return value;
}

function getOptionalPositiveNumber(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} harus lebih besar dari 0.`);
  }

  return value;
}

function getOptionalNonNegativeNumber(formData: FormData, key: string) {
  const rawValue = String(formData.get(key) ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} tidak boleh negatif.`);
  }

  return value;
}

function normalizeDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Tanggal produksi tidak valid.");
  }

  return value;
}

function generateProductionCode(productionDate: string) {
  const compactDate = productionDate.replaceAll("-", "");
  const suffix = randomUUID().slice(0, 8).toUpperCase();

  return `PROD-${compactDate}-${suffix}`;
}

export async function createProductionBatchAction(formData: FormData) {
  const context = await getUnitWorkContext();

  assertProductionFinishedGoodsContext(context, "Catat produksi barang jadi");

  const formulaId = getRequiredText(formData, "formulaId");
  const productionDate = normalizeDate(getRequiredText(formData, "productionDate"));
  const outputQuantity = getPositiveNumber(formData, "outputQuantity");
  const notes = getOptionalText(formData, "notes");
  const code = generateProductionCode(productionDate);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const formulaResult = await client.query<FormulaRow>(
      `
        SELECT
          pf.id::text AS formula_id,
          pf.code AS formula_code,
          pf.name AS formula_name,
          pp.id::text AS product_id,
          pp.name AS product_name,
          pp.unit_of_measure AS product_unit_of_measure,
          pf.output_quantity::text AS formula_output_quantity
        FROM production_formula pf
        JOIN production_product pp
          ON pp.id = pf.product_id
        WHERE pf.id = $1::uuid
          AND pf.bum_desa_id = $2::uuid
          AND pf.unit_usaha_id = $3::uuid
          AND pf.is_active = TRUE
        LIMIT 1
      `,
      [formulaId, context.bumDesaId, context.unitUsahaId]
    );

    const formula = formulaResult.rows[0];

    if (!formula) {
      throw new Error("Formula produksi tidak ditemukan.");
    }

    const formulaOutputQuantity = Number(formula.formula_output_quantity);

    if (!Number.isFinite(formulaOutputQuantity) || formulaOutputQuantity <= 0) {
      throw new Error("Output standar formula tidak valid.");
    }

    const formulaLinesResult = await client.query<FormulaLineRow>(
      `
        SELECT
          pfl.id::text AS formula_line_id,
          pm.id::text AS material_id,
          pm.name AS material_name,
          pm.unit_of_measure AS material_unit_of_measure,
          pfl.quantity::text AS formula_quantity,
          pm.default_unit_cost::text AS default_unit_cost,
          pm.is_stocked,
          pfl.notes,
          pfl.sort_order
        FROM production_formula_line pfl
        JOIN production_material pm
          ON pm.id = pfl.material_id
        WHERE pfl.formula_id = $1::uuid
          AND pfl.bum_desa_id = $2::uuid
          AND pfl.unit_usaha_id = $3::uuid
          AND pm.is_active = TRUE
        ORDER BY pfl.sort_order ASC
      `,
      [formulaId, context.bumDesaId, context.unitUsahaId]
    );

    if (formulaLinesResult.rows.length === 0) {
      throw new Error("Formula belum memiliki bahan.");
    }

    const batchResult = await client.query<{ id: string }>(
      `
        INSERT INTO production_batch (
          bum_desa_id,
          unit_usaha_id,
          formula_id,
          product_id,
          code,
          production_date,
          output_quantity,
          output_unit_of_measure,
          status,
          notes,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5,
          $6::date,
          $7,
          $8,
          'POSTED',
          $9,
          jsonb_build_object(
            'formula_code', $10::text,
            'formula_name', $11::text,
            'formula_output_quantity', $12::numeric
          )
        )
        RETURNING id::text AS id
      `,
      [
        context.bumDesaId,
        context.unitUsahaId,
        formulaId,
        formula.product_id,
        code,
        productionDate,
        outputQuantity,
        formula.product_unit_of_measure,
        notes,
        formula.formula_code,
        formula.formula_name,
        formulaOutputQuantity,
      ]
    );

    const productionBatchId = batchResult.rows[0]?.id;

    if (!productionBatchId) {
      throw new Error("Gagal mencatat produksi.");
    }

    const productionRatio = outputQuantity / formulaOutputQuantity;
    const globalCostMode = String(formData.get("unitCostMode") ?? "AUTO").trim();

    if (globalCostMode !== "AUTO" && globalCostMode !== "MANUAL") {
      throw new Error("Mode biaya produksi tidak valid.");
    }

    for (const line of formulaLinesResult.rows) {
      const formulaQuantity = Number(line.formula_quantity);
      const defaultUnitCost = Number(line.default_unit_cost);

      if (!Number.isFinite(formulaQuantity) || formulaQuantity <= 0) {
        throw new Error(`Jumlah standar bahan ${line.material_name} tidak valid.`);
      }

      if (!Number.isFinite(defaultUnitCost) || defaultUnitCost < 0) {
        throw new Error(`Harga default bahan ${line.material_name} tidak valid.`);
      }

      const plannedQuantity = formulaQuantity * productionRatio;
      const actualQuantity =
        getOptionalPositiveNumber(
          formData,
          `actualQuantity_${line.formula_line_id}`
        ) ?? plannedQuantity;

      const stockCostResult = await client.query<MaterialStockCostRow>(
        `
          WITH material_stock AS (
            SELECT
              COALESCE(
                SUM(
                  CASE
                    WHEN movement_direction = 'IN' THEN quantity
                    WHEN movement_direction = 'OUT' THEN -quantity
                    ELSE 0
                  END
                ),
                0
              ) AS quantity_on_hand,
              COALESCE(
                SUM(
                  CASE
                    WHEN movement_direction = 'IN' THEN total_amount
                    WHEN movement_direction = 'OUT' THEN -total_amount
                    ELSE 0
                  END
                ),
                0
              ) AS total_value
            FROM production_stock_movement
            WHERE bum_desa_id = $1::uuid
              AND unit_usaha_id = $2::uuid
              AND item_type = 'MATERIAL'
              AND material_id = $3::uuid
              AND movement_date <= $4::date
          )
          SELECT
            quantity_on_hand::text AS quantity_on_hand,
            total_value::text AS total_value,
            CASE
              WHEN quantity_on_hand > 0
              THEN (total_value / quantity_on_hand)::numeric(18,6)::text
              ELSE NULL
            END AS average_unit_cost
          FROM material_stock
        `,
        [
          context.bumDesaId,
          context.unitUsahaId,
          line.material_id,
          productionDate,
        ]
      );

      const stockCost = stockCostResult.rows[0];
      const stockQuantity = Number(stockCost?.quantity_on_hand ?? "0");
      const rawAverageUnitCost = stockCost?.average_unit_cost ?? null;
      const averageUnitCost =
        rawAverageUnitCost === null ? null : Number(rawAverageUnitCost);

      if (!Number.isFinite(stockQuantity)) {
        throw new Error(`Saldo stok bahan ${line.material_name} tidak valid.`);
      }

      if (line.is_stocked && stockQuantity < actualQuantity) {
        throw new Error(
          `Stok ${line.material_name} tidak cukup. Tersedia ${stockQuantity}, dibutuhkan ${actualQuantity}.`
        );
      }

      if (
        averageUnitCost !== null &&
        (!Number.isFinite(averageUnitCost) || averageUnitCost < 0)
      ) {
        throw new Error(`Rata-rata biaya bahan ${line.material_name} tidak valid.`);
      }

      const costMode = String(
        formData.get(`unitCostMode_${line.formula_line_id}`) ?? globalCostMode
      ).trim();

      if (costMode !== "AUTO" && costMode !== "MANUAL") {
        throw new Error(`Mode biaya bahan ${line.material_name} tidak valid.`);
      }

      const inputUnitCost = getOptionalNonNegativeNumber(
        formData,
        `unitCost_${line.formula_line_id}`
      );

      let unitCost: number;
      let unitCostSource: "STOCK_AVERAGE" | "DEFAULT" | "MANUAL";

      if (costMode === "MANUAL") {
        if (inputUnitCost === null) {
          throw new Error(
            `Harga satuan manual untuk ${line.material_name} wajib diisi.`
          );
        }

        unitCost = inputUnitCost;
        unitCostSource = "MANUAL";
      } else if (averageUnitCost !== null) {
        unitCost = averageUnitCost;
        unitCostSource = "STOCK_AVERAGE";
      } else {
        unitCost = defaultUnitCost;
        unitCostSource = "DEFAULT";
      }

      if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new Error(`Biaya bahan ${line.material_name} tidak valid.`);
      }

      await client.query(
        `
          INSERT INTO production_batch_material (
            production_batch_id,
            bum_desa_id,
            unit_usaha_id,
            material_id,
            formula_line_id,
            planned_quantity,
            actual_quantity,
            unit_of_measure,
            unit_cost,
            notes,
            sort_order,
            metadata
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid,
            $5::uuid,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            jsonb_build_object(
              'formula_quantity', $12::numeric,
              'production_ratio', $13::numeric,
              'unit_cost_source', $14::text
            )
          )
        `,
        [
          productionBatchId,
          context.bumDesaId,
          context.unitUsahaId,
          line.material_id,
          line.formula_line_id,
          plannedQuantity,
          actualQuantity,
          line.material_unit_of_measure,
          unitCost,
          line.notes,
          line.sort_order,
          formulaQuantity,
          productionRatio,
          unitCostSource,
        ]
      );

      await client.query(
        `
          INSERT INTO production_stock_movement (
            bum_desa_id,
            unit_usaha_id,
            production_batch_id,
            movement_date,
            item_type,
            material_id,
            movement_direction,
            movement_source,
            quantity,
            unit_of_measure,
            unit_cost,
            total_amount,
            notes
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::date,
            'MATERIAL',
            $5::uuid,
            'OUT',
            'PRODUCTION_MATERIAL_USAGE',
            $6,
            $7,
            $8,
            ($6::numeric * $8::numeric)::numeric(24,6),
            $9
          )
        `,
        [
          context.bumDesaId,
          context.unitUsahaId,
          productionBatchId,
          productionDate,
          line.material_id,
          actualQuantity,
          line.material_unit_of_measure,
          unitCost,
          `Pemakaian bahan untuk produksi ${formula.product_name}.`,
        ]
      );
    }

    const totalMaterialCostResult = await client.query<{
      total_material_cost: string;
    }>(
      `
        SELECT COALESCE(SUM(total_cost), 0)::text AS total_material_cost
        FROM production_batch_material
        WHERE production_batch_id = $1::uuid
      `,
      [productionBatchId]
    );

    const totalMaterialCost =
      totalMaterialCostResult.rows[0]?.total_material_cost ?? "0";

    await client.query(
      `
        INSERT INTO production_stock_movement (
          bum_desa_id,
          unit_usaha_id,
          production_batch_id,
          movement_date,
          item_type,
          product_id,
          movement_direction,
          movement_source,
          quantity,
          unit_of_measure,
          unit_cost,
          total_amount,
          notes
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::date,
          'PRODUCT',
          $5::uuid,
          'IN',
          'PRODUCTION_OUTPUT',
          $6,
          $7,
          ($8::numeric / $6::numeric)::numeric(18,6),
          $8::numeric,
          $9
        )
      `,
      [
        context.bumDesaId,
        context.unitUsahaId,
        productionBatchId,
        productionDate,
        formula.product_id,
        outputQuantity,
        formula.product_unit_of_measure,
        totalMaterialCost,
        `Hasil produksi ${formula.product_name}.`,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath("/unit/dashboard/produksi");
  revalidatePath("/unit/dashboard/produksi/catat-produksi");

  redirect(
    `/unit/dashboard/produksi/catat-produksi?created=${encodeURIComponent(code)}`
  );
}
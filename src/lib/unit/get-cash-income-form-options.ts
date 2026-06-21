import { db } from "@/lib/db/pool";

export type AccountOption = {
  code: string;
  name: string;
};

export type CashIncomeFormOptions = {
  cashAccountOptions: AccountOption[];
  incomeAccountOptions: AccountOption[];
};

type AccountOptionRow = {
  code: string;
  name: string;
};

export async function getCashIncomeFormOptions(): Promise<CashIncomeFormOptions> {
  const [cashAccounts, incomeAccounts] = await Promise.all([
    db.query<AccountOptionRow>(
      `
        SELECT
          kode AS code,
          nama AS name
        FROM akun
        WHERE bum_desa_id IS NULL
          AND level = 'D'
          AND is_active = TRUE
          AND is_kepmen_136 = TRUE
          AND kode LIKE '1.1.01.%'
        ORDER BY kode
        LIMIT 50
      `
    ),
    db.query<AccountOptionRow>(
      `
        SELECT
          kode AS code,
          nama AS name
        FROM akun
        WHERE bum_desa_id IS NULL
          AND level = 'D'
          AND is_active = TRUE
          AND is_kepmen_136 = TRUE
          AND kode LIKE '4.%'
        ORDER BY kode
        LIMIT 100
      `
    ),
  ]);

  return {
    cashAccountOptions: cashAccounts.rows.map((account) => ({
      code: account.code,
      name: account.name,
    })),
    incomeAccountOptions: incomeAccounts.rows.map((account) => ({
      code: account.code,
      name: account.name,
    })),
  };
}
import { db } from "@/lib/db/pool";

export type AccountOption = {
  code: string;
  name: string;
};

export type CapitalContributionFormOptions = {
  cashAccountOptions: AccountOption[];
  capitalAccountOptions: AccountOption[];
};

type AccountOptionRow = {
  code: string;
  name: string;
};

export async function getCapitalContributionFormOptions(): Promise<CapitalContributionFormOptions> {
  const [cashAccounts, capitalAccounts] = await Promise.all([
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
          AND normal_balance = 'KREDIT'
          AND (
            kode LIKE '3.1.01.%'
            OR kode LIKE '3.1.02.%'
            OR kode LIKE '3.4.01.%'
          )
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
    capitalAccountOptions: capitalAccounts.rows.map((account) => ({
      code: account.code,
      name: account.name,
    })),
  };
}
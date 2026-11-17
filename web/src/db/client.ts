import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type Db = NodePgDatabase;

export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 3_000 });
  return {
    db: drizzle({ client: pool }),
    close: () => pool.end(),
  };
}

export type DatabaseHealth =
  | { ok: true; database: string }
  | { ok: false; error: string };

export async function checkDatabaseHealth(db: Db): Promise<DatabaseHealth> {
  try {
    const result = await db.execute<{ database: string }>(
      sql`select current_database() as database`,
    );
    return { ok: true, database: result.rows[0].database };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

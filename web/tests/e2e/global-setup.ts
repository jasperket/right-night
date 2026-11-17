import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { e2eDatabaseUrl } from "./database";

// E2E gets its own database so integration tests (which truncate rightnight_test) can't
// wipe a Night mid-flow. Create it if missing, then apply migrations.
export default async function globalSetup() {
  const target = new URL(e2eDatabaseUrl);
  const name = target.pathname.slice(1);
  const admin = new URL(e2eDatabaseUrl);
  admin.pathname = "/postgres";

  const client = new Client({ connectionString: admin.href });
  await client.connect();
  try {
    const { rowCount } = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (!rowCount) await client.query(`create database "${name.replaceAll('"', '""')}"`);
  } finally {
    await client.end();
  }

  const db = new Client({ connectionString: e2eDatabaseUrl });
  await db.connect();
  try {
    await migrate(drizzle({ client: db }), { migrationsFolder: "./drizzle" });
  } finally {
    await db.end();
  }
}

import { afterAll, describe, expect, it } from "vitest";
import { checkDatabaseHealth, createDb } from "@/db/client";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://rightnight:rightnight-dev@localhost:5433/rightnight_test";

describe("checkDatabaseHealth", () => {
  const reachable = createDb(testDatabaseUrl);
  const unreachable = createDb(
    "postgres://rightnight:wrong@localhost:1/nowhere",
  );

  afterAll(async () => {
    await reachable.close();
    await unreachable.close();
  });

  it("reports ok and the database name for a running Postgres", async () => {
    await expect(checkDatabaseHealth(reachable.db)).resolves.toEqual({
      ok: true,
      database: "rightnight_test",
    });
  });

  it("reports not ok with an error message when Postgres is unreachable", async () => {
    const health = await checkDatabaseHealth(unreachable.db);

    expect(health.ok).toBe(false);
    expect(health).toHaveProperty("error", expect.any(String));
  });
});

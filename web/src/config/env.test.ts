import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a postgres DATABASE_URL", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://rightnight:secret@localhost:5432/rightnight",
    });

    expect(env.DATABASE_URL).toBe(
      "postgres://rightnight:secret@localhost:5432/rightnight",
    );
  });

  it("rejects a missing DATABASE_URL with a message naming it", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-postgres DATABASE_URL", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://localhost/db" })).toThrow(
      /DATABASE_URL/,
    );
  });
});

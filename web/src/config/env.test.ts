import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://rightnight:secret@localhost:5432/rightnight",
  N8N_SIGNING_SECRET: "a-shared-secret-of-at-least-32-chars",
  N8N_WEBHOOK_BASE_URL: "http://localhost:5678/webhook",
  APP_BASE_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("rejects a missing DATABASE_URL with a message naming it", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("rejects a non-postgres DATABASE_URL", () => {
    expect(() =>
      parseEnv({ ...valid, DATABASE_URL: "mysql://localhost/db" }),
    ).toThrow(/DATABASE_URL/);
  });

  it("rejects a signing secret shorter than 32 characters", () => {
    expect(() => parseEnv({ ...valid, N8N_SIGNING_SECRET: "short" })).toThrow(
      /N8N_SIGNING_SECRET/,
    );
  });

  it.each(["N8N_WEBHOOK_BASE_URL", "APP_BASE_URL"])(
    "rejects a %s that is not a URL",
    (name) => {
      expect(() => parseEnv({ ...valid, [name]: "not a url" })).toThrow(
        new RegExp(name),
      );
    },
  );
});

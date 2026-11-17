export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://rightnight:rightnight-dev@localhost:5433/rightnight_test";

export const testSigningSecret = "integration-test-secret-32-chars-long!";

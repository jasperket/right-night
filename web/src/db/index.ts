import { parseEnv } from "@/config/env";
import { createDb } from "./client";

let instance: ReturnType<typeof createDb> | undefined;

// One pool per server process, built from DATABASE_URL.
export function getDb() {
  instance ??= createDb(parseEnv(process.env).DATABASE_URL);
  return instance;
}

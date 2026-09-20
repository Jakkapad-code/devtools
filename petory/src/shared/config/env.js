import "server-only";
import { parseServerEnv } from "./env-schema";

let cachedEnv;

/** Read validated runtime configuration once per server process. */
export function getServerEnv() {
  if (!cachedEnv) cachedEnv = parseServerEnv(process.env);
  return cachedEnv;
}

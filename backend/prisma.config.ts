import { defineConfig } from "prisma/config";

/* Prisma 7 no longer auto-loads .env — Node 22+ can, natively. The file is
   optional (CI sets real env vars), so a missing .env is not an error. */
try {
  process.loadEnvFile();
} catch {
  /* no .env present */
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  /* Only migrate/introspect commands need a connection; `prisma generate`
     must keep working without a database (CI, fresh clones). */
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
});

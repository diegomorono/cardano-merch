/**
 * Pseudo-code Logical Map:
 * 1. Import 'drizzle' function from 'drizzle-orm/postgres-js'.
 * 2. Import 'postgres' driver client.
 * 3. Import everything from the local './schema' module to pass to the ORM schema configuration.
 * 4. Verify presence of 'DATABASE_URL' environment variable. If missing, throw a runtime error.
 * 5. Set up global caching to prevent Next.js hot-reloads from exhausting database connection pool limits.
 * 6. Initialize connection pool with connection management parameters (max: 10 connections, 20s idle timeout).
 * 7. Pass 'prepare: false' to the postgres client options. This disables prepared statements, preventing crashes
 *    when executing queries through transaction-level poolers (like Supabase Supavisor/PgBouncer on port 6543).
 * 8. Export the initialized type-safe 'db' instance.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined in the environment.');
}

// Preserve database connection pool across hot reloads in Next.js development mode
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// Establish connection pool with custom options to satisfy scale-to-zero and transaction pooler requirements
const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL, {
  max: 10,                 // Limit pool size
  idle_timeout: 20,        // Close idle connections after 20s to conserve database resources
  connect_timeout: 10,     // Wait 10s max for connection establishment
  prepare: false,          // CRITICAL: Disable prepared statements for compatibility with transaction pooler (port 6543)
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

// Create and export the ORM instance
export const db = drizzle(conn, { schema });

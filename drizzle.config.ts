/**
 * Pseudo-code Logical Map:
 * 1. Import the 'defineConfig' helper from 'drizzle-kit'.
 * 2. Define the configuration object with:
 *    - schema file location: './src/lib/db/schema.ts'
 *    - output migration folder: './supabase/migrations' (routed to local Supabase directory)
 *    - database dialect: 'postgresql'
 *    - credentials URL from process.env.DATABASE_URL (falling back to an empty string to allow schema generation without active connection)
 *    - debugging options: verbose: true, strict: true
 * 3. Export configuration as default.
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});

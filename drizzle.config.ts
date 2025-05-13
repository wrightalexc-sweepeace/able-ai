import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './app/lib/drizzle/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NILEDB_URL!,
  },
  verbose: true, // Optional: for more detailed output during generation
  strict: true,  // Optional: for stricter schema checking
});
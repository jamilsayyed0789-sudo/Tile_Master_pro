import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_vfChA0WH1qoP@ep-solitary-block-ap2azrz4-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function main() {
  console.log("Dropping old tables if they conflict...");

  // Drop old auth table that conflicts with new Better Auth schema
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  await sql`DROP TABLE IF EXISTS alembic_version CASCADE`;
  console.log("  ✓ Old auth tables dropped");

  console.log("Creating Better Auth tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      name TEXT NOT NULL,
      image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("  ✓ users");

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("  ✓ sessions");

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      id_token TEXT,
      password TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("  ✓ accounts");

  await sql`
    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("  ✓ verifications");

  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_type TEXT NOT NULL DEFAULT 'trial',
      trial_end_date TIMESTAMP,
      subscription_end_date TIMESTAMP,
      account_status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("  ✓ subscriptions");

  // Recreate tile_catalog table
  await sql`
    CREATE TABLE IF NOT EXISTS tile_catalog (
      id SERIAL PRIMARY KEY,
      tile_name TEXT,
      tile_number TEXT,
      tile_size TEXT,
      image_url TEXT,
      catalog_name TEXT,
      page_number INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  ✓ tile_catalog");

  console.log("\nAll tables created successfully!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});

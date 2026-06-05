import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_vfChA0WH1qoP@ep-solitary-block-ap2azrz4-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function main() {
  const tables = await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log("Existing tables:");
  for (const t of tables) {
    console.log(`  ${t.table_name} (${t.table_type})`);
  }

  if (tables.find(t => t.table_name === "users")) {
    const cols = await sql`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `;
    console.log("\nusers columns:");
    for (const c of cols) {
      console.log(`  ${c.column_name}: ${c.data_type}`);
    }
  }
}

main().catch(console.error);

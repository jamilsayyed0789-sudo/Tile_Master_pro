import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import https from "https";
import http from "http";

// Load DB URL
const envContent = readFileSync("backend/.env", "utf-8");
const dbUrl = envContent.split("\n").find(l => l.startsWith("DATABASE_URL=")).split("=").slice(1).join("=").trim();
const sql = neon(dbUrl);

// Cloudinary config
const CLOUD_NAME = "dwlzgxtxc";
const API_KEY = "575113237972778";
const API_SECRET = "89cu3eUxg9EdkVOTjfoD2BBAe6w";

function cloudinaryRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
    const options = {
      hostname: "api.cloudinary.com",
      path: `/v1_1/${CLOUD_NAME}${path}`,
      method,
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function listAllCloudinaryImages() {
  let allResources = [];
  let nextCursor = null;
  do {
    let path = `/resources/image?max_results=100`;
    if (nextCursor) path += `&next_cursor=${nextCursor}`;
    const result = await cloudinaryRequest("GET", path);
    if (result.status === 200 && result.body.resources) {
      allResources.push(...result.body.resources);
      nextCursor = result.body.next_cursor;
    } else {
      console.log("Cloudinary list error:", result.status, JSON.stringify(result.body).substring(0, 200));
      break;
    }
  } while (nextCursor);
  return allResources;
}

async function deleteCloudinaryImages(publicIds) {
  if (publicIds.length === 0) return { deleted: 0 };
  const result = await cloudinaryRequest("DELETE", "/resources/image/upload", { public_ids: publicIds });
  return result;
}

async function main() {
  console.log("=== CLOUDINARY CLEANUP ===");
  const images = await listAllCloudinaryImages();
  console.log(`Found ${images.length} images in Cloudinary`);

  if (images.length > 0) {
    const ids = images.map(r => r.public_id);
    console.log("Sample public IDs:", ids.slice(0, 5));

    // Delete in batches of 100
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      console.log(`Deleting batch ${Math.floor(i / 100) + 1} (${batch.length} images)...`);
      const result = await deleteCloudinaryImages(batch);
      console.log("  Result:", JSON.stringify(result.body).substring(0, 200));
    }
  }

  console.log("\n=== DATABASE CLEANUP ===");

  // Count records first
  const tileCount = await sql`SELECT COUNT(*) as count FROM tile_catalog`;
  console.log(`tile_catalog records: ${tileCount[0].count}`);

  const userCount = await sql`SELECT COUNT(*) as count FROM users`;
  console.log(`users records: ${userCount[0].count}`);

  const sessionCount = await sql`SELECT COUNT(*) as count FROM sessions`;
  console.log(`sessions records: ${sessionCount[0].count}`);

  const accountCount = await sql`SELECT COUNT(*) as count FROM accounts`;
  console.log(`accounts records: ${accountCount[0].count}`);

  const subCount = await sql`SELECT COUNT(*) as count FROM subscriptions`;
  console.log(`subscriptions records: ${subCount[0].count}`);

  // Delete all data
  await sql`DELETE FROM tile_catalog`;
  console.log("Deleted all tile_catalog records");

  // Delete auth-related data (order matters due to foreign keys)
  await sql`DELETE FROM sessions`;
  console.log("Deleted all sessions");

  await sql`DELETE FROM accounts`;
  console.log("Deleted all accounts");

  await sql`DELETE FROM subscriptions`;
  console.log("Deleted all subscriptions");

  await sql`DELETE FROM users`;
  console.log("Deleted all users");

  // Verify
  const verifyTiles = await sql`SELECT COUNT(*) as count FROM tile_catalog`;
  const verifyUsers = await sql`SELECT COUNT(*) as count FROM users`;
  const verifySubs = await sql`SELECT COUNT(*) as count FROM subscriptions`;
  console.log("\n=== VERIFICATION ===");
  console.log(`tile_catalog: ${verifyTiles[0].count}`);
  console.log(`users: ${verifyUsers[0].count}`);
  console.log(`subscriptions: ${verifySubs[0].count}`);

  console.log("\nDone! All Cloudinary images and database records deleted.");
}

main().catch(e => { console.error("ERROR:", e); process.exit(1); });

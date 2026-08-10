#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Read the items.json file
const dataPath = path.join(process.cwd(), "data", "items.json");
const items = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const convexUrl = process.env.VITE_CONVEX_URL;
const client = new ConvexHttpClient(convexUrl);

console.log("🔑 Populating itemKey field for existing database items...\n");

try {
  // Extract only the fields needed for the migration
  const migrationData = items.map(item => ({
    restaurantName: item.restaurantName,
    itemName: item.itemName,
    address: item.address,
    itemKey: item.itemKey
  }));

  console.log(`Sending ${migrationData.length} items to populate itemKey field...`);
  
  const result = await client.mutation("migrations:populateItemKeys", {
    items: migrationData
  });
  
  console.log(`✅ Migration completed successfully!`);
  console.log(`Updated: ${result.updated} items`);
  console.log(`Not found: ${result.notFound} items`);
  console.log(`Total processed: ${result.total} items`);
  
  if (result.notFound > 0) {
    console.log(`\n⚠️  ${result.notFound} items were not found in the database. This might be normal if some JSON items don't exist in the DB yet.`);
  }
  
} catch (error) {
  console.error("❌ Migration failed:", error);
}
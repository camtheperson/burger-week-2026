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

console.log(`Found ${items.length} items to migrate`);

// Initialize Convex client
const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("VITE_CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

// migrateItemData's validator only accepts these fields -- image/imageUrl/itemKey
// are populated separately below (image via scrape-images.js, itemKey via
// populateItemKeys) since they don't exist yet at initial-location-creation time.
function toMigrationArgs(item) {
  const {
    restaurantName, neighborhood, itemName, url, description, altDescription,
    type, glutenFree, allowMinors, allowTakeout, purchaseLimits, allowDelivery,
    vegSubstitute, vegSurcharge, address, hours, latitude, longitude,
    geocoded_address, geocoding_method,
  } = item;
  return {
    restaurantName, neighborhood, itemName, url, description, altDescription,
    type, glutenFree, allowMinors, allowTakeout, purchaseLimits, allowDelivery,
    vegSubstitute, vegSurcharge, address, hours, latitude, longitude,
    geocoded_address, geocoding_method,
  };
}

// Migrate data in batches to avoid timeouts
const batchSize = 50;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  console.log(`Migrating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);

  try {
    await client.mutation("migrations:migrateItemData", {
      items: batch.map(toMigrationArgs)
    });
    console.log(`✓ Batch ${Math.floor(i / batchSize) + 1} completed`);
  } catch (error) {
    console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    process.exit(1);
  }
}

// itemKey powers ratings/favorites lookup (getItemEnrichmentData matches on it) --
// without this pass those features silently no-op for every item.
console.log("Populating itemKey for ratings/favorites lookup...");
const itemsWithKeys = items.filter(item => item.itemKey);
for (let i = 0; i < itemsWithKeys.length; i += batchSize) {
  const batch = itemsWithKeys.slice(i, i + batchSize);
  console.log(`Populating item keys ${Math.floor(i / batchSize) + 1}/${Math.ceil(itemsWithKeys.length / batchSize)}`);

  try {
    await client.mutation("migrations:populateItemKeys", {
      items: batch.map(({ restaurantName, itemName, address, itemKey }) => ({
        restaurantName, itemName, address, itemKey
      }))
    });
    console.log(`✓ Batch ${Math.floor(i / batchSize) + 1} completed`);
  } catch (error) {
    console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    process.exit(1);
  }
}

console.log("✅ Migration completed successfully!");
process.exit(0);
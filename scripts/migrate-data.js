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

// Migrate data in batches to avoid timeouts
const batchSize = 50;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  console.log(`Migrating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
  
  try {
    await client.mutation("migrations:migrateItemData", {
      items: batch
    });
    console.log(`✓ Batch ${Math.floor(i / batchSize) + 1} completed`);
  } catch (error) {
    console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    process.exit(1);
  }
}

console.log("✅ Migration completed successfully!");
process.exit(0);
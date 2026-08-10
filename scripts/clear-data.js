import { ConvexHttpClient } from "convex/browser";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const convexUrl = process.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("VITE_CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function clearData() {
  try {
    console.log('Clearing all data from database...');
    const result = await client.mutation("cleanup:clearAllData", {});
    console.log('✅ Database cleared successfully:', result);
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    process.exit(1);
  }
}

clearData();
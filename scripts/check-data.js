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

async function checkData() {
  try {
    console.log('Checking Convex data...');
    
    // Get a few locations
    const locations = await client.query("locations:getLocations", {});
    console.log(`Found ${locations?.length || 0} locations`);
    
    if (locations && locations.length > 0) {
      console.log('First location:', JSON.stringify(locations[0], null, 2));
      
      if (locations[0].items && locations[0].items.length > 0) {
        console.log('First item:', JSON.stringify(locations[0].items[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();
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

async function checkTypes() {
  try {
    console.log('Checking type distribution...');
    
    // Check for vegetarian locations
    const vegetarianLocations = await client.query("locations:getLocations", {
      type: "vegetarian"
    });
    console.log(`Found ${vegetarianLocations?.length || 0} locations with vegetarian options`);
    
    // Check for vegan locations
    const veganLocations = await client.query("locations:getLocations", {
      type: "vegan"
    });
    console.log(`Found ${veganLocations?.length || 0} locations with vegan options`);
    
    // Check for meat locations
    const meatLocations = await client.query("locations:getLocations", {
      type: "meat"
    });
    console.log(`Found ${meatLocations?.length || 0} locations with meat options`);
    
    // Show some examples
    if (vegetarianLocations && vegetarianLocations.length > 0) {
      console.log('\nSample vegetarian location:');
      console.log(`${vegetarianLocations[0].restaurantName} - ${vegetarianLocations[0].items?.[0]?.itemName} (${vegetarianLocations[0].items?.[0]?.type})`);
    }
    
    if (veganLocations && veganLocations.length > 0) {
      console.log('\nSample vegan location:');
      console.log(`${veganLocations[0].restaurantName} - ${veganLocations[0].items?.[0]?.itemName} (${veganLocations[0].items?.[0]?.type})`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTypes();
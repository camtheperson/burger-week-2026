import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from "convex/browser";
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

class ImageMigrator {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'items.json');
    
    // Initialize Convex client
    const convexUrl = process.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("VITE_CONVEX_URL environment variable is required");
    }
    this.convexClient = new ConvexHttpClient(convexUrl);
  }

  async loadItemsWithImages() {
    console.log('Loading items with images from items.json...');
    
    if (!fs.existsSync(this.dataPath)) {
      throw new Error(`items.json not found at ${this.dataPath}`);
    }
    
    const data = fs.readFileSync(this.dataPath, 'utf8');
    const allItems = JSON.parse(data);
    
    // Filter to only items that have image data
    const itemsWithImages = allItems.filter(item => item.image || item.imageUrl);
    
    console.log(`Found ${itemsWithImages.length} items with images out of ${allItems.length} total items`);
    
    return itemsWithImages.map(item => ({
      restaurantName: item.restaurantName,
      itemName: item.itemName,
      image: item.image,
      imageUrl: item.imageUrl
    }));
  }

  async migrateImages() {
    try {
      const items = await this.loadItemsWithImages();
      
      if (items.length === 0) {
        console.log('No items with images found. Run the scrape-images script first.');
        return;
      }

      console.log(`Starting migration for ${items.length} items with images...`);
      
      const result = await this.convexClient.mutation("migrations:migrateImagesOnly", {
        items
      });
      
      console.log('\n✅ Migration complete!');
      console.log(`📸 Updated ${result.updated} items`);
      console.log(`❌ ${result.notFound} items not found in database`);
      console.log(`📊 Processed ${result.total} total items`);
      
      if (result.notFound > 0) {
        console.log('\n⚠️  Some items were not found in the database.');
        console.log('This might be normal if some items were filtered out during the main migration.');
      }
      
      return result;
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

// Command line usage
async function main() {
  console.log('🖼️  Starting image-only migration...\n');
  
  const migrator = new ImageMigrator();
  
  try {
    await migrator.migrateImages();
    console.log('\n🎉 Image migration completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ImageMigrator;
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from "convex/browser";
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

class ImageScraper {
  constructor() {
    this.dataPath = path.join(__dirname, '..', 'data', 'items.json');
    this.imagesDir = path.join(__dirname, '..', 'public', 'images');
    this.concurrency = 3; // Number of parallel image downloads
    this.delay = 1000; // Delay between requests (ms)
    
    // Initialize Convex client. No Convex project exists yet for a brand-new
    // event, so fall back to reading/writing data/items.json directly and
    // skip any Convex mutation calls until VITE_CONVEX_URL is set.
    const convexUrl = process.env.VITE_CONVEX_URL;
    this.convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;
  }

  async init() {
    // Ensure images directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async loadItemData() {
    if (!this.convexClient) {
      console.log('No VITE_CONVEX_URL set - loading items directly from data/items.json...');
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    }

    console.log('Loading item data from Convex...');
    try {
      const locations = await this.convexClient.query("locations:getLocationsForScraping", {});
      console.log(`Loaded ${locations.length} locations from Convex`);
      return locations;
    } catch (error) {
      console.error('Error loading item data from Convex:', error);
      // Fallback to JSON file if Convex fails
      try {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      } catch (jsonError) {
        console.error('Error loading JSON fallback:', jsonError);
        throw error;
      }
    }
  }

  async updateLocalItemsJson(items) {
    console.log('Updating local items.json file...');
    try {
      // Create a map of items by their unique identifier (restaurant + item name)
      const itemMap = new Map();
      items.forEach(item => {
        const key = `${item.locationName}_${item.itemName}`;
        itemMap.set(key, item);
      });

      // Load existing items.json
      let existingItems = [];
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        existingItems = JSON.parse(data);
      }

      // Update existing items with image paths
      const updatedItems = existingItems.map(item => {
        const key = `${item.restaurantName}_${item.itemName}`;
        const updatedItem = itemMap.get(key);
        if (updatedItem && updatedItem.image) {
          return {
            ...item,
            image: updatedItem.image,
            imageUrl: updatedItem.imageUrl
          };
        }
        return item;
      });

      // Write back to items.json
      fs.writeFileSync(this.dataPath, JSON.stringify(updatedItems, null, 2));
      console.log('✅ Successfully updated local items.json file');
    } catch (error) {
      console.error('Error updating local items.json:', error);
    }
  }

  async updateItemImage(itemId, imageUrl, imagePath) {
    if (!this.convexClient) {
      console.log(`No Convex deployment yet - image path stored in data/items.json only: ${imagePath}`);
      return;
    }
    console.log(`Updating item ${itemId} with image: ${imagePath}`);
    try {
      await this.convexClient.mutation("locations:updateItemImage", {
        itemId,
        imageUrl,
        imagePath
      });
      console.log('Image data updated in Convex successfully');
    } catch (error) {
      console.error('Error updating image data in Convex:', error);
      throw error;
    }
  }

  async scrapeImageFromUrl(itemUrl) {
    try {
      console.log(`Scraping image from: ${itemUrl}`);
      
      const response = await fetch(itemUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();

      const $ = cheerio.load(html);
      
      // Find images using the specified selector
      const imageElements = $('.item-image img');
      
      if (imageElements.length === 0) {
        console.log(`No images found for ${itemUrl}`);
        return null;
      }

      // Get the first image's src
      const firstImage = $(imageElements[0]);
      let imageSrc = firstImage.attr('src') || firstImage.attr('data-src');
      
      if (!imageSrc) {
        console.log(`No src found for image in ${itemUrl}`);
        return null;
      }

      // Handle relative URLs
      if (imageSrc.startsWith('//')) {
        imageSrc = 'https:' + imageSrc;
      } else if (imageSrc.startsWith('/')) {
        imageSrc = 'https://everout.com' + imageSrc;
      }

      console.log(`Found image: ${imageSrc}`);
      return imageSrc;

    } catch (error) {
      console.error(`Error scraping ${itemUrl}:`, error.message);
      return null;
    }
  }

  async downloadImage(imageUrl, filename) {
    try {
      console.log(`Downloading image: ${imageUrl}`);
      
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const filePath = path.join(this.imagesDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      console.log(`Image saved: ${filename}`);
      return filePath;

    } catch (error) {
      console.error(`Error downloading image ${imageUrl}:`, error.message);
      return null;
    }
  }

  generateFilename(restaurantName, itemName, imageUrl) {
    // Create a safe filename from restaurant and item names
    const safeName = (restaurantName + '_' + itemName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50); // Limit length

    // Get file extension from URL
    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname;
      let ext = path.extname(pathname) || '.jpg';
      
      // Handle common image formats
      if (!ext.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        ext = '.jpg';
      }
      
      return `${safeName}${ext}`;
    } catch (error) {
      // If URL parsing fails, use a default extension
      return `${safeName}.jpg`;
    }
  }

  async processLocationItem(item, locationName, index, total) {
    console.log(`\n[${index + 1}/${total}] Processing: ${locationName} - ${item.itemName}`);
    
    if (!item.url) {
      console.log('No URL found for item, skipping...');
      return { success: false, item: null };
    }

    // Check if image already exists and has correct path
    if (item.image && item.image.startsWith('/burger-week-2026/images/')) {
      console.log('Image already exists with correct path, skipping...');
      return { success: false, item: null };
    }

    try {
      // Scrape image URL from the page
      const imageUrl = await this.scrapeImageFromUrl(item.url);
      
      if (!imageUrl) {
        console.log('No image found on page');
        return { success: false, item: null };
      }

      // Generate filename
      const filename = this.generateFilename(locationName, item.itemName, imageUrl);
      const imagePath = `/burger-week-2026/images/${filename}`;
      
      // Check if file already exists
      const filePath = path.join(this.imagesDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`File already exists: ${filename}`);
        // Update database with existing image
        await this.updateItemImage(item._id, imageUrl, imagePath);
        return { 
          success: true, 
          item: { 
            ...item, 
            image: imagePath,
            imageUrl: imageUrl 
          }
        };
      }

      // Download image
      const downloadedPath = await this.downloadImage(imageUrl, filename);
      
      if (downloadedPath) {
        // Update database with new image
        await this.updateItemImage(item._id, imageUrl, imagePath);
        console.log(`✅ Successfully processed image for ${item.itemName}`);
        return { 
          success: true, 
          item: { 
            ...item, 
            image: imagePath,
            imageUrl: imageUrl 
          }
        };
      } else {
        console.log('Failed to download image');
        return { success: false, item: null };
      }

    } catch (error) {
      console.error(`Error processing ${locationName} - ${item.itemName}:`, error.message);
      return { success: false, item: null };
    }
  }

  async scrapeAllImages() {
    await this.init();
    
    const locations = await this.loadItemData();

    // The Convex query returns locations with a nested `items` array; the
    // data/items.json fallback is already a flat array of one row per item.
    let allItems;
    if (this.convexClient) {
      console.log(`Found ${locations.length} locations to process`);
      allItems = [];
      for (const location of locations) {
        if (location.items && location.items.length > 0) {
          for (const item of location.items) {
            allItems.push({
              ...item,
              locationName: location.restaurantName
            });
          }
        }
      }
    } else {
      allItems = locations.map(item => ({
        ...item,
        locationName: item.restaurantName
      }));
    }

    console.log(`Found ${allItems.length} total items to process`);

    let processedCount = 0;
    let successCount = 0;
    const updatedItems = [];
    
    // Process items in batches to avoid overwhelming the server
    for (let i = 0; i < allItems.length; i += this.concurrency) {
      const batch = allItems.slice(i, i + this.concurrency);

      const batchPromises = batch.map(async (item, batchIndex) => {
        const result = await this.processLocationItem(
          item, 
          item.locationName, 
          i + batchIndex, 
          allItems.length
        );
        processedCount++;
        if (result.success) {
          successCount++;
          updatedItems.push(result.item);
        }
        return result.success;
      });

      await Promise.all(batchPromises);

      // Add delay between batches to be respectful
      if (i + this.concurrency < allItems.length) {
        console.log(`\nWaiting ${this.delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    // Update local items.json file with the new image data
    if (updatedItems.length > 0) {
      await this.updateLocalItemsJson(updatedItems);
    }

    // Print summary
    console.log(`\n✅ Scraping complete!`);
    console.log(`📸 Successfully processed images for ${successCount}/${processedCount} items`);
    console.log(`📁 Images saved to: ${this.imagesDir}`);
    
    return {
      total: processedCount,
      successful: successCount,
      failed: processedCount - successCount
    };
  }
}

// Command line usage
async function main() {
  const scraper = new ImageScraper();
  
  try {
    await scraper.scrapeAllImages();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ImageScraper;

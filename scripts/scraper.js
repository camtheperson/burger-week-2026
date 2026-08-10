import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

class FoodWeekScraper {
  constructor() {
    this.baseUrl = process.env.FOOD_WEEK_URL;
    this.items = [];
    this.concurrency = 5; // Number of parallel requests
  }

  async scrapeMainPage() {
    console.log('Fetching main Food Week page: ', this.baseUrl);
    
    try {
      const response = await fetch(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();

      const $ = cheerio.load(data);
      const restaurants = [];

      // Find the main container and iterate through each restaurant div
      $('.row.mt-4 > div').each((index, element) => {
        const $element = $(element);
        
        // Find restaurant name and neighborhood in h4
        const restaurantLink = $element.find('h4 a');
        if (restaurantLink.length > 0) {
          const restaurantText = restaurantLink.text().trim();
          
          // Extract restaurant name and location
          const match = restaurantText.match(/^(.+?)\s*\((.+?)\)$/);
          if (match) {
            const restaurantName = match[1].trim();
            const neighborhood = match[2].trim();
            
            // Find item name and URL in h3
            const itemNameElement = $element.find('h3 a');
            const itemName = itemNameElement.text().trim();
            let itemUrl = itemNameElement.attr('href');
            
            // Fix item URL construction
            if (itemUrl && !itemUrl.startsWith('http')) {
              itemUrl = itemUrl.startsWith('/') ? `https://everout.com${itemUrl}` : `https://everout.com/${itemUrl}`;
            }
            
            if (restaurantName && itemName && itemUrl) {
              restaurants.push({
                restaurantName,
                neighborhood,
                itemName,
                url: itemUrl
              });
            }
          }
        }
      });

      console.log(`Found ${restaurants.length} restaurants`);
      return restaurants;
    } catch (error) {
      console.error('Error scraping main page:', error.message);
      return [];
    }
  }

  async scrapeRestaurantDetails(restaurant) {
    if (!restaurant.url) return restaurant;

    try {
      console.log(`Scraping details for ${restaurant.restaurantName}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(restaurant.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();

      const $ = cheerio.load(data);
      
      // Extract all the food details from the page
      let description = '';
      let altDescription = '';
      let type = '';
      let glutenFree = null;
      let allowMinors = null;
      let allowTakeout = null;
      let purchaseLimits = null;
      let allowDelivery = null;
      
      // Find the element containing all the food details
      let foodDetailsText = '';
      $('*').each((i, el) => {
        const text = $(el).text();
        if (text.includes("What's on them...") && text.includes('What they say...')) {
          foodDetailsText = text;
          return false; // break
        }
      });
      
      if (foodDetailsText) {
        const lines = foodDetailsText.split('\n').map(l => l.trim()).filter(l => l);
        
        // Extract "What's on them..." (description)
        const whatsOnThemIndex = lines.findIndex(l => l.includes("What's on them..."));
        if (whatsOnThemIndex !== -1 && whatsOnThemIndex + 1 < lines.length) {
          description = lines[whatsOnThemIndex + 1];
        }
        
        // Extract "What they say..." (altDescription)
        const whatTheySayIndex = lines.findIndex(l => l.includes("What they say..."));
        if (whatTheySayIndex !== -1 && whatTheySayIndex + 1 < lines.length) {
          altDescription = lines[whatTheySayIndex + 1];
        }
        
        // Extract "Meat or Vegetarian?"
        const meatVegIndex = lines.findIndex(l => l.includes("Meat or Vegetarian?"));
        if (meatVegIndex !== -1 && meatVegIndex + 1 < lines.length) {
          type = lines[meatVegIndex + 1].toLowerCase();
        }
        
        // Extract "Gluten Free?" 
        const glutenFreeIndex = lines.findIndex(l => l.includes("Gluten Free?"));
        if (glutenFreeIndex !== -1 && glutenFreeIndex + 1 < lines.length) {
          const glutenFreeValue = lines[glutenFreeIndex + 1].toLowerCase();
          glutenFree = glutenFreeValue === 'yes';
        }
        
        // Extract "Allow Minors?"
        const allowMinorsIndex = lines.findIndex(l => l.includes("Allow Minors?"));
        if (allowMinorsIndex !== -1 && allowMinorsIndex + 1 < lines.length) {
          const allowMinorsValue = lines[allowMinorsIndex + 1].toLowerCase();
          allowMinors = allowMinorsValue === 'yes';
        }
        
        // Extract "Allow Takeout?"
        const allowTakeoutIndex = lines.findIndex(l => l.includes("Allow Takeout?"));
        if (allowTakeoutIndex !== -1 && allowTakeoutIndex + 1 < lines.length) {
          const allowTakeoutValue = lines[allowTakeoutIndex + 1].toLowerCase();
          allowTakeout = allowTakeoutValue === 'yes';
        }
        
        // Extract "Purchase limits"
        const purchaseLimitsIndex = lines.findIndex(l => l.includes("Purchase limits"));
        if (purchaseLimitsIndex !== -1 && purchaseLimitsIndex + 1 < lines.length) {
          const purchaseLimitsValue = lines[purchaseLimitsIndex + 1].toLowerCase();
          purchaseLimits = purchaseLimitsValue === 'yes';
        }
        
        // Extract "Allow Delivery?"
        const allowDeliveryIndex = lines.findIndex(l => l.includes("Allow Delivery?"));
        if (allowDeliveryIndex !== -1 && allowDeliveryIndex + 1 < lines.length) {
          const allowDeliveryValue = lines[allowDeliveryIndex + 1].toLowerCase();
          allowDelivery = allowDeliveryValue === 'yes';
        }
      }
      
      // Fallback: if we couldn't find the structured data, try to extract basic description
      if (!description) {
        description = $('.event-description').text().trim() || 
                     $('.description').text().trim() ||
                     $('p').first().text().trim();
      }

      // Extract address using multiple comprehensive methods
      let address = '';
      
      $('.location-info').each(function() {
        // Extract only the direct text nodes (address) by cloning, removing child elements, and getting text
        const addressText = $(this).clone().children().remove().end().text().trim().replace(/\s+/g, ' ');
        
        if (addressText) {
          // Look for street address pattern in the extracted text
          const addressMatch = addressText.match(/(\d+[^,\n]*?(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Pl|Place|Ct|Court|SE|SW|NE|NW)[^,\n]*?)[\s,]*([A-Za-z\s]+),?\s*(OR|Oregon)(?:\s+\d{5})?/i);
          
          if (addressMatch) {
            const street = addressMatch[1].replace(/\([^)]+\)/g, '').trim();
            const city = addressMatch[2].trim();
            const state = addressMatch[3];
            
            address = `${street} ${city}, ${state}`;
            
            // Add zip code if found
            const zipMatch = addressText.match(/\b(\d{5})\b/);
            if (zipMatch) {
              address += ` ${zipMatch[1]}`;
            }
            
            return false;
          }
          
          // Fallback: look for just street address and assume Portland
          const streetOnlyMatch = addressText.match(/(\d+[^,\n]*?(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Pl|Place|Ct|Court|SE|SW|NE|NW)[^,\n]*)/i);
          if (streetOnlyMatch) {
            const street = streetOnlyMatch[1].replace(/\([^)]+\)/g, '').trim();
            address = `${street}, Portland, OR`;
            return false;
          }
        }
      });

      if (address) {
        console.log(`Found full address: "${address}" for ${restaurant.restaurantName}`);
      } else {
        console.log(`No address found for ${restaurant.restaurantName}`);
      }

      // Extract hours from the API endpoint
      let hours = [];
      
      // Extract occurrence ID from the item URL
      const occurrenceMatch = restaurant.url ? restaurant.url.match(/\/e(\d+)\/?$/) : null;
      
      if (occurrenceMatch) {
        const occurrenceId = occurrenceMatch[1];
        
        try {
          console.log(`Fetching schedule for occurrence ${occurrenceId}...`);
          
          const params = new URLSearchParams({
            market: 'portland',
            page_size: '15',
            occurrence: occurrenceId,
            cb: Date.now().toString()
          });
          
          const scheduleController = new AbortController();
          const scheduleTimeoutId = setTimeout(() => scheduleController.abort(), 5000);
          
          const scheduleResponse = await fetch(`https://everout.com/api/schedule-dates/?${params}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Referer': restaurant.url,
              'Accept': 'application/json, text/plain, */*'
            },
            signal: scheduleController.signal
          });
          
          clearTimeout(scheduleTimeoutId);
          
          if (!scheduleResponse.ok) {
            throw new Error(`HTTP error! status: ${scheduleResponse.status}`);
          }
          
          const scheduleData = await scheduleResponse.json();
          
          if (scheduleData && scheduleData.results) {
            hours = scheduleData.results.map(result => ({
              dayOfWeek: result.date_string.split(' ')[0], // "Fri", "Sat", etc.
              date: result.date_string.substring(4), // "Aug 15", "Aug 16", etc.
              hours: result.time_string,
              fullDate: result.date
            }));
            
            console.log(`Found ${hours.length} schedule entries for ${restaurant.restaurantName}`);
          }
          
        } catch (scheduleError) {
          console.log(`Could not fetch schedule for ${restaurant.restaurantName}:`, scheduleError.message);
        }
      }
      
      // Fallback: if no API data, try to extract from the page HTML
      if (hours.length === 0) {
        const timePattern = /\d{1,2}:\d{2}\s*(AM|PM|am|pm)/gi;
        $('*').each((i, el) => {
          const text = $(el).text();
          if (timePattern.test(text) && text.length < 200) {
            // Store as a simple string for backwards compatibility
            hours = text.trim();
            return false;
          }
        });
      }

      return {
        ...restaurant,
        description: description.substring(0, 500).trim(),
        altDescription: altDescription.substring(0, 500).trim(),
        type,
        glutenFree,
        allowMinors,
        allowTakeout,
        purchaseLimits,
        allowDelivery,
        address,
        hours
      };
    } catch (error) {
      console.error(`Error scraping details for ${restaurant.restaurantName}:`, error.message);
      return restaurant;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process items in batches to improve performance
  async processBatch(items, processor, batchSize = 3) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => processor(item));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        const processedResults = batchResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`Error processing item ${i + index}:`, result.reason?.message || result.reason);
            return batch[index]; // Return original item if processing failed
          }
        });
        
        results.push(...processedResults);
        
        // Add delay between batches to be respectful
        if (i + batchSize < items.length) {
          console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)}, waiting 1 second...`);
          await this.delay(1000);
        }
      } catch (error) {
        console.error('Batch processing error:', error);
        results.push(...batch); // Add original items if batch fails
      }
    }
    
    return results;
  }

  async scrapeAll() {
    console.log('Starting Item Week scraping...');
    
    // Get initial restaurant list
    const restaurants = await this.scrapeMainPage();
    
    if (restaurants.length === 0) {
      console.log('No restaurants found. Exiting.');
      return;
    }

    // Scrape details for each restaurant in batches
    console.log('Scraping restaurant details in batches...');
    const detailedRestaurants = await this.processBatch(
      restaurants, 
      (restaurant) => this.scrapeRestaurantDetails(restaurant),
      this.concurrency
    );

    this.items = detailedRestaurants;
    await this.saveData();
    
    console.log(`Scraping complete! Found ${this.items.length} restaurants.`);
    console.log(`Addresses found: ${this.items.filter(r => r.address && r.address.trim()).length}/${this.items.length}`);
    
    return this.items;
  }

  async saveData() {
    const dataDir = path.join(__dirname, '..', 'data');
    const filePath = path.join(dataDir, 'items.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing data to preserve coordinates
    let existingData = [];
    if (fs.existsSync(filePath)) {
      try {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
        console.log(`Loaded ${existingData.length} existing restaurants to preserve coordinates`);
      } catch (error) {
        console.log('Could not load existing data, creating new file');
      }
    }

    // Merge new data with existing coordinates
    const mergedData = this.items.map(newRestaurant => {
      // Find matching restaurant in existing data
      const existingRestaurant = existingData.find(existing => 
        existing.restaurantName === newRestaurant.restaurantName &&
        existing.itemName === newRestaurant.itemName
      );

      // If we have existing coordinates, preserve them
      if (existingRestaurant && existingRestaurant.latitude && existingRestaurant.longitude) {
        return {
          ...newRestaurant,
          latitude: existingRestaurant.latitude,
          longitude: existingRestaurant.longitude,
          geocoded_address: existingRestaurant.geocoded_address,
          geocoding_method: existingRestaurant.geocoding_method
        };
      }

      return newRestaurant;
    });

    // Save the merged data
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
    console.log(`Data saved to ${filePath}`);

    // Also save a summary
    const summary = {
      totalRestaurants: mergedData.length,
      withAddresses: mergedData.filter(item => item.address && item.address.trim()).length,
      geocodedRestaurants: mergedData.filter(item => item.latitude && item.longitude).length,
      lastUpdated: new Date().toISOString(),
      neighborhoods: [...new Set(mergedData.map(item => item.neighborhood))].sort()
    };
    
    fs.writeFileSync(path.join(dataDir, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log('Summary saved');
    console.log(`Coordinates preserved for ${summary.geocodedRestaurants} restaurants`);

    // Update this.items with the merged data
    this.items = mergedData;
  }
}

// Run the scraper if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new FoodWeekScraper();
  scraper.scrapeAll().catch(console.error);
}

export default FoodWeekScraper;

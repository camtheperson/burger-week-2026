import ImageScraper from './scrape-images.js';
import ImageMigrator from './migrate-images.js';

async function main() {
  console.log('🚀 Starting complete image processing pipeline...\n');
  
  try {
    // Step 1: Scrape images
    console.log('📸 Step 1: Scraping and downloading images...');
    const scraper = new ImageScraper();
    const scrapeResults = await scraper.scrapeAllImages();
    
    console.log(`\n✅ Scraping completed: ${scrapeResults.successful}/${scrapeResults.total} successful\n`);
    
    // Step 2: Migrate images to database
    console.log('🗄️  Step 2: Migrating image data to database...');
    const migrator = new ImageMigrator();
    const migrateResults = await migrator.migrateImages();
    
    console.log('\n🎉 Complete pipeline finished successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`   • Images scraped: ${scrapeResults.successful}/${scrapeResults.total}`);
    console.log(`   • Database records updated: ${migrateResults.updated}`);
    console.log(`   • Items not found in DB: ${migrateResults.notFound}`);
    
  } catch (error) {
    console.error('\n💥 Pipeline failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
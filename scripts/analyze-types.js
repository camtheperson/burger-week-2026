import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

// Analyze type patterns
const typePatterns = {};
let multiTypeCount = 0;

data.forEach(item => {
  const type = item.type || 'meat';
  typePatterns[type] = (typePatterns[type] || 0) + 1;
  
  if (type.includes(',')) {
    multiTypeCount++;
    console.log(`${item.restaurantName} - ${item.itemName}: ${type}`);
  }
});

console.log('\nType patterns:');
console.log(typePatterns);
console.log(`\nItems with multiple types: ${multiTypeCount}/${data.length}`);

// Show how types will be split
console.log('\nType splitting preview:');
const splitExamples = data.filter(item => item.type && item.type.includes(','))
  .slice(0, 5)
  .map(item => {
    const types = item.type.split(',').map(t => t.trim().toLowerCase()).filter(t => 
      t === 'meat' || t === 'vegetarian' || t === 'vegan'
    );
    return { restaurant: item.restaurantName, item: item.itemName, original: item.type, types };
  });

console.table(splitExamples);
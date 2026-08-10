import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/items.json', 'utf8'));

// Fix type values - prioritize in order: vegan > vegetarian > meat
const fixedData = data.map(item => {
  if (typeof item.type === 'string') {
    const type = item.type.toLowerCase();
    if (type.includes('vegan')) {
      item.type = 'vegan';
    } else if (type.includes('vegetarian')) {
      item.type = 'vegetarian';
    } else {
      item.type = 'meat';
    }
  }
  return item;
});

fs.writeFileSync('data/items.json', JSON.stringify(fixedData, null, 2));
console.log('Fixed type values in items.json');
console.log('Summary:');
const typeCounts = fixedData.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] || 0) + 1;
  return acc;
}, {});
console.log(typeCounts);
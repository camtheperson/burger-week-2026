#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Function to generate a deterministic ID based on restaurant name and item name
function generateItemKey(restaurantName, itemName, address) {
  // Include address to ensure uniqueness for restaurants with same name in different locations
  const combined = `${restaurantName.toLowerCase().trim()}_${itemName.toLowerCase().trim()}_${address.toLowerCase().trim()}`;
  // Create a shorter, more readable key
  return crypto.createHash('md5').update(combined).digest('hex').substring(0, 12);
}

// Read the items.json file
const dataPath = path.join(process.cwd(), 'data', 'items.json');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log(`Adding unique keys to ${items.length} items...`);

// Add itemKey to each item
const updatedItems = items.map(item => ({
  ...item,
  itemKey: generateItemKey(item.restaurantName, item.itemName, item.address)
}));

// Check for duplicates
const keys = updatedItems.map(item => item.itemKey);
const uniqueKeys = new Set(keys);
if (keys.length !== uniqueKeys.size) {
  console.warn(`⚠️  Found ${keys.length - uniqueKeys.size} duplicate keys`);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  console.log('Duplicate keys:', [...new Set(duplicates)]);
} else {
  console.log('✅ All keys are unique');
}

// Write the updated items back to the file
fs.writeFileSync(dataPath, JSON.stringify(updatedItems, null, 2));

console.log('✅ Added unique keys to all items');
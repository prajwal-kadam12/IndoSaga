import fs from 'fs/promises';
import path from 'path';

// Helper function to convert JS object to PHP array syntax
function convertToPHP(obj: any, indent = 0): string {
  const spaces = '    '.repeat(indent);
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }
    
    const items = obj.map(item => {
      return `${spaces}    ${convertToPHP(item, indent + 1)}`;
    }).join(',\n');
    
    return `[\n${items}\n${spaces}]`;
  }
  
  if (obj === null) {
    return 'null';
  }
  
  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }
  
  if (typeof obj === 'number') {
    return obj.toString();
  }
  
  if (typeof obj === 'string') {
    // Escape single quotes and backslashes
    const escaped = obj.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
  }
  
  if (typeof obj === 'object') {
    const entries = Object.entries(obj).map(([key, value]) => {
      const phpKey = `'${key}'`;
      const phpValue = convertToPHP(value, indent + 1);
      return `${spaces}    ${phpKey} => ${phpValue}`;
    }).join(',\n');
    
    return `[\n${entries}\n${spaces}]`;
  }
  
  return 'null';
}

async function convertJsonToPhp(jsonFileName: string): Promise<void> {
  try {
    const jsonPath = path.resolve(process.cwd(), 'data', jsonFileName);
    const phpFileName = jsonFileName.replace('.json', '.php');
    const phpPath = path.resolve(process.cwd(), 'data', phpFileName);
    
    console.log(`Converting ${jsonFileName} to ${phpFileName}...`);
    
    const jsonData = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonData);
    
    const phpContent = `<?php
// PHP version of ${jsonFileName}
// Converted from JSON format for MySQL database integration

return ${convertToPHP(data)};
?>`;
    
    await fs.writeFile(phpPath, phpContent);
    console.log(`✅ Created ${phpFileName}`);
  } catch (error) {
    console.warn(`⚠️  Failed to convert ${jsonFileName}:`, error);
  }
}

async function main() {
  console.log('🔄 Converting all JSON files to PHP format...\n');
  
  const jsonFiles = [
    'categories.json',
    'subcategories.json',
    'products.json',
    'users.json',
    'cartItems.json',
    'wishlistItems.json',
    'orders.json',
    'orderItems.json',
    'contactInquiries.json',
    'supportTickets.json',
    'appointments.json',
    'productReviews.json',
    'productQuestions.json'
  ];
  
  for (const file of jsonFiles) {
    await convertJsonToPhp(file);
  }
  
  console.log('\n🎉 All JSON files converted to PHP format!');
  console.log('\n📁 PHP files created in data/ directory:');
  
  for (const file of jsonFiles) {
    const phpFile = file.replace('.json', '.php');
    console.log(`   - data/${phpFile}`);
  }
  
  console.log('\n📋 These PHP files can now be used with your MySQL database.');
  console.log('💡 Note: To connect from Replit, your MySQL server needs to allow connections from IP: 34.11.197.112');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
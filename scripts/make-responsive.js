#!/usr/bin/env node

/**
 * Automated Mobile Responsive Converter
 * This script helps convert existing components to mobile-responsive versions
 */

const fs = require('fs');
const path = require('path');

// Responsive class mappings
const responsiveReplacements = [
  // Grid columns
  { from: /className="grid grid-cols-4/g, to: 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' },
  { from: /className="grid grid-cols-3/g, to: 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
  { from: /className="grid grid-cols-2/g, to: 'className="grid grid-cols-1 sm:grid-cols-2' },
  
  // Padding
  { from: /className="p-6/g, to: 'className="p-4 md:p-6' },
  { from: /className="p-8/g, to: 'className="p-4 md:p-6 lg:p-8' },
  { from: /className="px-6/g, to: 'className="px-4 md:px-6' },
  { from: /className="py-6/g, to: 'className="py-4 md:py-6' },
  
  // Text sizes
  { from: /className="text-3xl/g, to: 'className="text-2xl md:text-3xl' },
  { from: /className="text-2xl/g, to: 'className="text-xl md:text-2xl' },
  { from: /className="text-xl/g, to: 'className="text-lg md:text-xl' },
  
  // Spacing
  { from: /className="space-y-6/g, to: 'className="space-y-4 md:space-y-6' },
  { from: /className="space-x-6/g, to: 'className="space-x-4 md:space-x-6' },
  { from: /className="gap-6/g, to: 'className="gap-4 md:gap-6' },
  
  // Flex direction
  { from: /className="flex items-center space-x-4/g, to: 'className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4' },
];

function makeResponsive(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  responsiveReplacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changes += matches.length;
    }
  });
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Made ${changes} responsive updates to ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
  
  return changes;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalChanges = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'build') {
      totalChanges += processDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      totalChanges += makeResponsive(filePath);
    }
  });
  
  return totalChanges;
}

// Main execution
const frontendSrc = path.join(__dirname, '../frontend/src');

console.log('🚀 Starting Mobile Responsive Conversion...\n');
console.log(`Processing directory: ${frontendSrc}\n`);

const totalChanges = processDirectory(frontendSrc);

console.log(`\n✨ Complete! Made ${totalChanges} total responsive updates.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Test on mobile devices');
console.log('3. Commit the changes');
console.log('\n💡 Tip: Use Chrome DevTools mobile emulation for testing');

const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const colorMap = {
  'amber-500/10': 'blue-500/10',
  'amber-500/20': 'blue-500/20',
  'amber-500/30': 'blue-500/30',
  'amber-500/50': 'blue-500/50',
  'amber-500': 'blue-500',
  'amber-400': 'blue-400',
  'amber-300': 'blue-300',
  'amber-200': 'blue-200',
  'amber-900': 'blue-900',
  'amber-950': 'slate-900',
  'yellow-500': 'blue-500',
  'yellow-400': 'blue-400',
  'yellow-300': 'blue-300',
  'orange-500': 'blue-500',
  'orange-400': 'blue-400',
  'fuchsia-500': 'blue-500',
  'fuchsia-400': 'blue-400',
  'purple-500': 'blue-500',
  'purple-400': 'blue-400',
  'purple-600': 'blue-600',
  'from-fuchsia-500': 'from-blue-500',
  'to-purple-600': 'to-blue-600',
  'from-amber-500': 'from-blue-500',
  'to-yellow-500': 'to-blue-500'
};

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Regular expression replacement for color mappings to ensure word boundaries
    Object.keys(colorMap).forEach(key => {
      // Create a regex that replaces the key when it's a tailwind class
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![0-9])', 'g');
      content = content.replace(regex, colorMap[key]);
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});

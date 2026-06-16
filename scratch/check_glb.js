const fs = require('fs');
const path = require('path');

const glbPath = path.join(__dirname, '..', 'frontend', 'public', 'models', 'hall', 'vintage_coffee_table_70s_03_freebie.glb');

try {
  const data = fs.readFileSync(glbPath);
  const chunkLength = data.readUInt32LE(12);
  const chunkType = data.readUInt32LE(16);
  
  if (chunkType === 0x4E4F534A) { // 'JSON'
    const jsonStr = data.slice(20, 20 + chunkLength).toString('utf-8');
    const json = JSON.parse(jsonStr);
    
    // Find POSITION accessors to compute bounding box
    if (json.accessors) {
      let min = [Infinity, Infinity, Infinity];
      let max = [-Infinity, -Infinity, -Infinity];
      let found = false;
      
      json.accessors.forEach((acc, i) => {
        if (acc.type === 'VEC3' && acc.min && acc.max) {
          found = true;
          for (let j = 0; j < 3; j++) {
            if (acc.min[j] < min[j]) min[j] = acc.min[j];
            if (acc.max[j] > max[j]) max[j] = acc.max[j];
          }
        }
      });
      
      if (found) {
        console.log("Bounding box min:", min);
        console.log("Bounding box max:", max);
        console.log("Dimensions:", [
          max[0] - min[0],
          max[1] - min[1],
          max[2] - min[2]
        ]);
      } else {
        console.log("No POSITION accessors with min/max found");
      }
    }
  } else {
    console.log("First chunk is not JSON");
  }
} catch (err) {
  console.error("Error reading GLB:", err);
}

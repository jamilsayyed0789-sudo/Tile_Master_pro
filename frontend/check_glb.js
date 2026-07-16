const fs = require('fs');

function parseGLB(path) {
  const buffer = fs.readFileSync(path);
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') {
    console.error('Not a valid GLB file');
    return;
  }
  
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);
  
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.toString('utf8', 16, 20);
  
  if (chunkType !== 'JSON') {
    console.error('First chunk is not JSON');
    return;
  }
  
  const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
  const json = JSON.parse(jsonString);
  
  console.log('--- MATERIALS ---');
  if (json.materials) {
    json.materials.forEach((m, i) => console.log(`[${i}] ${m.name}`));
  } else {
    console.log('No materials found');
  }
  
  console.log('\n--- MESHES ---');
  if (json.meshes) {
    json.meshes.forEach((m, i) => {
      console.log(`[${i}] ${m.name}`);
      if (m.primitives) {
        m.primitives.forEach((p, j) => {
          const matIndex = p.material;
          const matName = matIndex !== undefined && json.materials ? json.materials[matIndex].name : 'none';
          console.log(`  primitive ${j}: material = ${matName}`);
        });
      }
    });
  } else {
    console.log('No meshes found');
  }
}

parseGLB('c:/Personal_Work/Tile_box_calculator/frontend/public/models/hall/base.glb');

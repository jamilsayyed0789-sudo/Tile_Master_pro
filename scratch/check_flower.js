const fs = require('fs');
const { Document, NodeIO } = require('@gltf-transform/core');
const { bounds } = require('@gltf-transform/functions');

async function main() {
    const io = new NodeIO();
    const doc = await io.read('c:/Personal_Work/Tile_box_calculator/frontend/public/models/kitchen/flowers_in_pink_vase.glb');
    const root = doc.getRoot();
    const scene = root.getDefaultScene() || root.listScenes()[0];

    const bbox = bounds(scene);
    console.log('--- Scene Bounds ---');
    console.log(`Min: [${bbox.min[0].toFixed(3)}, ${bbox.min[1].toFixed(3)}, ${bbox.min[2].toFixed(3)}]`);
    console.log(`Max: [${bbox.max[0].toFixed(3)}, ${bbox.max[1].toFixed(3)}, ${bbox.max[2].toFixed(3)}]`);
    console.log(`Size: [${(bbox.max[0] - bbox.min[0]).toFixed(3)}, ${(bbox.max[1] - bbox.min[1]).toFixed(3)}, ${(bbox.max[2] - bbox.min[2]).toFixed(3)}]`);
}
main().catch(console.error);

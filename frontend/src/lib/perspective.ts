// Computes the adjugate of a 3x3 matrix
function adj(m: number[]) { 
  return [
    m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
    m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
    m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3]
  ];
}
function multmm(a: number[], b: number[]) { // multiply two 3x3 matrices
  const c = Array(9);
  for (let i = 0; i !== 3; ++i) {
    for (let j = 0; j !== 3; ++j) {
      let cij = 0;
      for (let k = 0; k !== 3; ++k) {
        cij += a[3*i + k]*b[3*k + j];
      }
      c[3*i + j] = cij;
    }
  }
  return c;
}
function multmv(m: number[], v: number[]) { // multiply 3x3 matrix by 3x1 vector
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2]
  ];
}
function basisToPoints(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
  const m = [
    x1, x2, x3,
    y1, y2, y3,
     1,  1,  1
  ];
  const v = multmv(adj(m), [x4, y4, 1]);
  return multmm(m, [
    v[0], 0, 0,
    0, v[1], 0,
    0, 0, v[2]
  ]);
}
function general2DProjection(
  x1s: number, y1s: number, x1d: number, y1d: number,
  x2s: number, y2s: number, x2d: number, y2d: number,
  x3s: number, y3s: number, x3d: number, y3d: number,
  x4s: number, y4s: number, x4d: number, y4d: number
) {
  const s = basisToPoints(x1s, y1s, x2s, y2s, x3s, y3s, x4s, y4s);
  const d = basisToPoints(x1d, y1d, x2d, y2d, x3d, y3d, x4d, y4d);
  return multmm(d, adj(s));
}

/**
 * Projects a source canvas into a quadrilateral on a destination canvas.
 * @param srcCanvas The repeated tile texture canvas
 * @param dstCtx The destination 2D context
 * @param corners [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
 */
export function drawPerspectiveCanvas(
  srcCanvas: HTMLCanvasElement,
  dstCtx: CanvasRenderingContext2D,
  corners: [number, number][]
) {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const t = general2DProjection(
    0, 0, corners[0][0], corners[0][1],
    w, 0, corners[1][0], corners[1][1],
    w, h, corners[2][0], corners[2][1],
    0, h, corners[3][0], corners[3][1]
  );
  
  // Inverse matrix to go from dst pixel to src pixel
  const invT = adj(t);
  
  // Find bounding box on destination to iterate over
  let minX = Math.min(corners[0][0], corners[1][0], corners[2][0], corners[3][0]);
  let maxX = Math.max(corners[0][0], corners[1][0], corners[2][0], corners[3][0]);
  let minY = Math.min(corners[0][1], corners[1][1], corners[2][1], corners[3][1]);
  let maxY = Math.max(corners[0][1], corners[1][1], corners[2][1], corners[3][1]);
  
  minX = Math.floor(Math.max(0, minX));
  minY = Math.floor(Math.max(0, minY));
  maxX = Math.ceil(Math.min(dstCtx.canvas.width, maxX));
  maxY = Math.ceil(Math.min(dstCtx.canvas.height, maxY));
  
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, w, h);
  
  const dstData = dstCtx.getImageData(minX, minY, maxX - minX, maxY - minY);
  
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      // dst to src mapping
      const u = invT[0]*x + invT[1]*y + invT[2];
      const v = invT[3]*x + invT[4]*y + invT[5];
      const w_z = invT[6]*x + invT[7]*y + invT[8];
      
      const sx = u / w_z;
      const sy = v / w_z;
      
      // if inside src bounds
      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const srcIdx = (Math.floor(sy) * w + Math.floor(sx)) * 4;
        const dstIdx = ((y - minY) * (maxX - minX) + (x - minX)) * 4;
        
        dstData.data[dstIdx] = srcData.data[srcIdx];
        dstData.data[dstIdx+1] = srcData.data[srcIdx+1];
        dstData.data[dstIdx+2] = srcData.data[srcIdx+2];
        dstData.data[dstIdx+3] = srcData.data[srcIdx+3];
      }
    }
  }
  
  dstCtx.putImageData(dstData, minX, minY);
}

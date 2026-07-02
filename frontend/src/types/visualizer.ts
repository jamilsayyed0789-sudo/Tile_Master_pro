export type Point = [number, number];

export interface SurfaceMetadata {
  corners: Point[]; // 4 points: top-left, top-right, bottom-right, bottom-left
}

export interface TemplateMetadata {
  id: string;
  name: string;
  wall?: SurfaceMetadata;
  floor?: SurfaceMetadata;
  accent?: SurfaceMetadata;
}

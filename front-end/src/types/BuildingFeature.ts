// src/types/BuildingFeature.ts
export interface BuildingFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  properties: {
    name: string;
    label: string;
    description?: string; 
    website?: string; 
  };
}

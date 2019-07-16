import {GeoJsonProperties, Geometry, Position} from "geojson";
import {NamedFeatureCollection} from "./named.feature.collection";

/**
 * This interface represents a GeoJSON feature collection with added properties for a grid
 * ("Foreign Members" as specified in section 6.1 of RFC 7946)
 */
export interface GridFeatureCollection<G extends Geometry | null = Geometry, P = GeoJsonProperties>
  extends NamedFeatureCollection<G, P> {
  grid: {
    base: Position,
    right: Position,
    down: Position,
    horizontal: [string, string],
    vertical: [string, string]
  };
}

/**
 * Check whether the GeoJson object is a multiline
 */
export function isGridCollection(collection: NamedFeatureCollection): collection is GridFeatureCollection {
  return !!(<GridFeatureCollection>collection).grid;
}

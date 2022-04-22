import {FeatureGroup, LatLng} from "leaflet";
import {Encoding} from "./encoding";

/**
 * This provides functionality for exporting in the TomTom OV2 format
 */
export namespace OV2 {

  export function mapGroup(group: FeatureGroup) {
    const records = group.getLayers()
      .map(layer => supportsOV2(layer) ? layer.toOV2() : null)
      .filter((entry): entry is Blob => entry !== null);

    if (!records.length) {
      // No records, do not create anything
      return null;
    }

    // Create a skipper record so POIs are excluded from search when far away
    const bbox = group.getBounds().pad(2);
    const length = records.reduce((acc, entry) => acc + entry.size, 0);
    const skipper = OV2.skipperRecord(bbox.getNorthEast(), bbox.getSouthWest(), length);

    // Combine the skipper and all entries
    return new Blob([skipper, ...records]);
  }

  export function skipperRecord(ne: LatLng, sw: LatLng, length: number): Blob {
    return new Blob([
      new Uint8Array([1]),
      new Uint32Array([length, ne.lng * 100000, ne.lat * 100000, sw.lng * 100000, sw.lat * 100000]),
    ]);
  }

  export function simpleRecord(latlng: LatLng, text: string): Blob {
    // TomTom uses cp1252 because apparently it's 1995
    const content = Encoding.asCP1252(text);

    // Length: Type byte, length (int32), lat/lng (int32), content, null byte
    const length = 14 + content.size;

    // Combine everything
    return new Blob([
      new Uint8Array([2]),
      new Uint32Array([length, latlng.lng * 100000, latlng.lat * 100000]),
      content,
      new Uint8Array([0])
    ]);
  }

  /**
   * This interface marks instances that support creating OV2 records
   */
  export interface SupportsOV2 {

    /**
     * Get a binary representation of everything in this layer
     * @return A binary representation in the TomTom OV2 format
     */
    toOV2(): Blob | null;

  }

  export function supportsOV2(obj: any): obj is SupportsOV2 {
    return "toOV2" in obj;
  }
}

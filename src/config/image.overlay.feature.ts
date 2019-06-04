import {Feature, Polygon} from "geojson";
import {ImageInfo} from "./image.info";

/**
 * This interface contains the extended polygon configuration for an image overlay
 */
export interface ImageOverlayFeature extends Feature<Polygon, ImageOverlayProperties> {

  /** The data and metadata for the image file */
  imageInfo?: ImageInfo;

}

export interface ImageOverlayProperties {
  /** The filename for the original file, used for matching on import */
  originalFile: string;

  /** The filename for the generated file, used for displaying */
  overlayFile?: string;
}

export function isImageOverlayFeature(feature: Feature): feature is ImageOverlayFeature {
  return feature && feature.geometry.type === "Polygon" && !!(<ImageOverlayProperties>feature.properties).originalFile
    && feature.geometry.coordinates.length === 1 && feature.geometry.coordinates[0].length === 5;
}

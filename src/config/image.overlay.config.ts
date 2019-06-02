import {Coordinates} from "./coordinates";
import {ImageInfo} from "./image.info";
import {FeatureSetConfig} from "./feature.set.config";

/**
 * This interface contains the configuration for an image overlay
 */
export interface ImageOverlayConfig extends FeatureSetConfig {
  type: "image";

  /** The data and metadata for the image */
  imageInfo: ImageInfo;

  /** The coordinates of the four corners (top-left, top-right, bottom-left, bottom-right) */
  corners?: [Coordinates, Coordinates, Coordinates, Coordinates];

  /** The bounds of the resulting layer after transformations are applied (south-west, north-east) */
  bounds?: [Coordinates, Coordinates]
}

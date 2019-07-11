import {Feature, FeatureCollection, Geometry} from "geojson";
import {Control} from "leaflet";

/**
 * This interface defines additional methods on editable layers used for modifying and exporting them
 */
export interface EditableLayer {

  /**
   * The additional buttons from each layer
   */
  getControls(): Control.EasyButton[];

  /**
   * Called when the feature collection is (un)selected on the map
   * @param selected Whether the feature collection is now selected or not
   */
  select(selected: boolean): void;

  /**
   * Export the data of this feature set
   */
  download(): void;

  toGeoJSON(): FeatureCollection | Feature | Geometry;

}

export function isEditableLayer(layer: any): layer is EditableLayer {
  return "getControls" in layer && "select" in layer && "download" in layer;
}

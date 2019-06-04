import {Feature, FeatureCollection, Geometry} from "geojson";
import {Control} from "leaflet";

/**
 * This interface defines additional methods on editable layers used for modifying and exporting them
 */
export interface EditableLayer {

  getControls(): Control.EasyButton[];

  select(selected: boolean): void;

  download(): void;

  toGeoJSON(): FeatureCollection | Feature | Geometry;

}

export function isEditableLayer(layer: any): layer is EditableLayer {
  return "getControls" in layer && "select" in layer && "download" in layer;
}

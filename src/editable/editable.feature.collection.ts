import {Feature} from "geojson";
import {Control, LatLng} from "leaflet";
import "leaflet-easybutton";

import {isImageOverlayFeature} from "../config";
import {FileDownloader} from "../file";
import {FeatureCollectionLayer, NamedFeatureCollection} from "../geojson";

import {EditableLayer, isEditableLayer} from "./editable.layer";
import {EditableImageOverlay} from "./image/editable.image.overlay";

/**
 * This class adds editing features to the basic GeoJson layer group
 */
export class EditableFeatureCollection extends FeatureCollectionLayer implements EditableLayer {

  /** The displayed name of this feature collection */
  name: string;

  constructor(featureCollection: NamedFeatureCollection) {
    super(featureCollection);
    this.name = featureCollection.name;
  }

  protected polygonToLayer(feature: Feature | null, latlngs: LatLng[][]) {
    if (feature && isImageOverlayFeature(feature) && feature.imageInfo) {
      return new EditableImageOverlay(feature);
    }

    return super.polygonToLayer(feature, latlngs);
  }

  /**
   * The additional buttons from each layer
   */
  getControls(): Control.EasyButton[] {
    const controls: Control.EasyButton[] = [];
    this.eachEditableLayer(layer => controls.push.apply(controls, layer.getControls()));
    return controls;
  }

  /**
   * Called when the feature set is (un)selected on the map
   * @param selected Whether the feature set is now selected or not
   */
  select(selected: boolean) {
    if (selected) {
      this.fitBounds();
    }
    this.eachEditableLayer(layer => layer.select(selected));
  };

  private fitBounds() {
    if (!this._map) {
      return;
    }

    const bounds = this.getBounds();
    if (bounds.getWest() - bounds.getEast() && bounds.getSouth() - bounds.getNorth()) {
      this._map.fitBounds(bounds, {padding: [30, 30]});
    }
  }

  /**
   * Completely remove this feature set and destroy all resources
   */
  remove(): this {
    this.eachLayer(layer => layer.remove());
    return this;
  }

  /**
   * Export the data of this feature set
   */
  download() {
    // Call specific download methods for each layer
    this.eachEditableLayer(layer => layer.download());

    // Export the GeoJson for the layer
    const json = JSON.stringify(this.toGeoJSON()), name = this.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    new FileDownloader(`${name}.json`).setString(json).download().destroy();
  }

  toGeoJSON(): NamedFeatureCollection {
    const json = <NamedFeatureCollection>super.toGeoJSON();
    json.name = this.name;
    return json;
  }

  private eachEditableLayer(fn: (layer: EditableLayer) => void) {
    this.eachLayer(layer => isEditableLayer(layer) && fn(layer));
  }
}

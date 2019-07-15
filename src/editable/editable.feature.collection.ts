import {BehaviorSubject} from "rxjs";

import {Feature, FeatureCollection, LineString, MultiLineString, Point, Polygon} from "geojson";
import {Control, DomUtil, GeoJSON, LatLng, LeafletEvent, LeafletMouseEvent} from "leaflet";
import "leaflet-easybutton";

import {ToggleButton} from "../button";
import {isImageOverlayFeature} from "../config";
import {FileDownloader} from "../file";
import {Form, Modal} from "../form";
import {FeatureCollectionLayer, NamedFeatureCollection} from "../geojson";

import {EditableLayer, isEditableLayer} from "./editable.layer";
import {EditableMarker, MarkerClasses, MarkerOptions} from "./marker";
import {EditableImageOverlay} from "./image/editable.image.overlay";
import {Track} from "./track/track";

/**
 * This class adds editing features to the basic GeoJson layer group
 */
export class EditableFeatureCollection extends FeatureCollectionLayer implements EditableLayer {

  /** The displayed name of this feature collection */
  name: BehaviorSubject<string | null>;

  private readonly createMarkerButton: ToggleButton;

  private readonly modal: Modal;
  private readonly propertiesForm: Form;
  private readonly markerDefaults: MarkerOptions;

  constructor(featureCollection: NamedFeatureCollection) {
    super();

    this.createMarkerButton = new ToggleButton(
      "fa-map-marker-alt", active => this.createMarker(active),
      "Activate marker creation [.]", "Deactivate marker creation [.]", "."
    );

    this.name = new BehaviorSubject<string | null>(featureCollection.name);
    this.markerDefaults = new MarkerOptions(featureCollection.markerDefaults);

    this.propertiesForm = new Form([
      {label: "Name", data: this.name},
      {label: "Marker color", type: "color", data: this.markerDefaults.color},
      {label: "Marker icon", list: MarkerClasses.instance.list, data: this.markerDefaults.icon},
      {label: "Horizontal anchor", type: "range", min: -0.5, max: 0.5, step: 0.25, data: this.markerDefaults.hAnchor},
      {label: "Vertical anchor", type: "range", min: -1, max: 0, step: 0.25, data: this.markerDefaults.vAnchor}
    ]);

    this.modal = new Modal("Edit feature collection", this.propertiesForm.container);

    this.addData(featureCollection);
  }

  protected pointToLayer(feature: Feature<Point>, latlng: LatLng) {
    if (feature.properties && feature.properties.generated) {
      return null;
    }
    return new EditableMarker(feature, latlng, this.markerDefaults);
  }

  protected lineToLayer(feature: Feature<LineString>, latlngs: LatLng[]) {
    return new Track(feature);
  }

  protected multiLineToLayer(feature: Feature<MultiLineString>, latlngs: LatLng[][]) {
    return new Track(feature);
  }

  protected polygonToLayer(feature: Feature<Polygon>, latlngs: LatLng[][]) {
    if (feature && isImageOverlayFeature(feature) && feature.imageInfo) {
      return new EditableImageOverlay(feature);
    }

    return super.polygonToLayer(feature, latlngs);
  }

  /**
   * The additional buttons from each layer
   */
  getControls(): Control.EasyButton[] {
    const controls: Control.EasyButton[] = [this.createMarkerButton];
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
    } else {
      this.createMarkerButton.active = false;
    }
    this.eachEditableLayer(layer => layer.select(selected));
  };

  private fitBounds() {
    if (!this._map) {
      return;
    }

    const bounds = this.getBounds();
    if (bounds.isValid() && bounds.getWest() - bounds.getEast() && bounds.getSouth() - bounds.getNorth()) {
      this._map.fitBounds(bounds, {padding: [30, 30]});
    }
  }

  /**
   * Show the edit modal dialog for this feature collection
   */
  edit() {
    this.modal.show();
  }

  /**
   * Completely remove this feature set and destroy all resources
   */
  remove(): this {
    this.eachLayer(layer => layer.remove());
    this.propertiesForm.remove();
    this.modal.remove();
    return this;
  }

  /**
   * Export the data of this feature set
   */
  download() {
    // Call specific download methods for each layer
    this.eachEditableLayer(layer => layer.download());

    // Export the GeoJson for the layer
    const json = JSON.stringify(this.toGeoJSON()),
      name = String(this.name.getValue()).replace(/[^a-z0-9]/gi, "_").toLowerCase();
    new FileDownloader(`${name}.json`).setString(json).download().destroy();
  }

  toGeoJSON(): NamedFeatureCollection {
    return {
      ...<FeatureCollection>super.toGeoJSON(),
      name: this.name.value || "",
      markerDefaults: this.markerDefaults.getValues()
    };
  }

  private eachEditableLayer(fn: (layer: EditableLayer) => void) {
    this.eachLayer(layer => isEditableLayer(layer) && fn(layer));
  }

  private createMarker(active: boolean) {
    if (!this._map) {
      return;
    }

    if (active) {
      this._map.on("click", this.addMarker, this);
      DomUtil.addClass(this._map.getContainer(), "marker-creation");
    } else {
      this._map.off("click", this.addMarker, this);
      DomUtil.removeClass(this._map.getContainer(), "marker-creation");
    }
  }

  private addMarker(e: LeafletEvent) {
    if (!this._map || !(<LeafletMouseEvent>e).latlng) {
      return;
    }

    this.addData(<Point>{
      type: "Point",
      coordinates: GeoJSON.latLngToCoords((<LeafletMouseEvent>e).latlng)
    });
  }

}

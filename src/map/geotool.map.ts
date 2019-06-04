import {control, latLngBounds, Map, tileLayer} from "leaflet";

import {EditableFeatureCollection} from "../editable";
import {FileListener} from "../file";
import {NamedFeatureCollection} from "../geojson";
import {ActionsControl} from "./actions.control";
import {FeatureCollectionsControl} from "./feature.collections.control";

export type FeatureCollectionSelectCallback = (featureCollection: EditableFeatureCollection | null) => void;
export type FeatureCollectionChangeCallback = (featureCollection: EditableFeatureCollection) => void;

/**
 * This class acts as an entry point to the application and displays the map and controls
 */
export class GeotoolMap extends Map {

  private static readonly basemapAttribution = 'Grundkarte: <a href="https://www.basemap.at" target="_blank">basemap.at</a>,'
    + ' <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank">CC-BY 4.0</a>';
  private static readonly basemapSubdomains = ['maps', 'maps1', 'maps2', 'maps3', 'maps4'];
  private static readonly basemapBounds = latLngBounds([46.358770, 8.782379], [49.037872, 17.5]);

  private readonly controls: ActionsControl;
  private readonly featureCollections: FeatureCollectionsControl;

  private selectedCollection: EditableFeatureCollection | null = null;

  private selectCallbacks: FeatureCollectionSelectCallback[] = [];
  private deleteCallbacks: FeatureCollectionChangeCallback[] = [];
  private updateCallbacks: FeatureCollectionChangeCallback[] = [];

  constructor(selector: string) {
    super(selector, {
      center: [48.21, 16.37],
      zoom: 15
    });

    // Create and add base layers
    const hidpiLayer = tileLayer('https://{s}.wien.gv.at/basemap/bmaphidpi/normal/google3857/{z}/{y}/{x}.jpeg', {
      maxZoom: 19,
      subdomains: GeotoolMap.basemapSubdomains,
      bounds: GeotoolMap.basemapBounds,
      attribution: GeotoolMap.basemapAttribution,
    });
    const orthoLayer = tileLayer('https://{s}.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg', {
      maxZoom: 19,
      subdomains: GeotoolMap.basemapSubdomains,
      bounds: GeotoolMap.basemapBounds,
      attribution: GeotoolMap.basemapAttribution,
    });
    const osmLayer = tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "Grundkarte: © <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors"
    });

    hidpiLayer.addTo(this);
    control.layers({"Map": hidpiLayer, "Orthophoto": orthoLayer, "OpenStreetMap": osmLayer}).addTo(this);

    // Create controls for the feature collections
    this.featureCollections = new FeatureCollectionsControl({position: "bottomleft"}).addTo(this);
    this.controls = new ActionsControl({position: "bottomleft"}).addTo(this);

    // Listen for dropped files
    new FileListener(document.body, config => this.addFeatureCollection(config));

    // Focus the map so keyboard navigation can be used
    this.getContainer().focus();
  }

  /**
   * Add a feature collection to the map
   * @param config The config object containing the relevant parameters for the feature collection
   */
  addFeatureCollection(config: NamedFeatureCollection) {
    // Create a new editable feature collection from the config object
    const featureCollection = new EditableFeatureCollection(config).addTo(this);

    // Add it to the feature collections control and immediately select it
    this.featureCollections.addFeatureCollection(featureCollection);
    this.selectFeatureCollection(featureCollection);
  }

  /**
   * Completely remove a feature collection from the map
   * @param featureCollection The feature collection to delete
   */
  deleteFeatureCollection(featureCollection: EditableFeatureCollection) {
    // Call the destruction logic of the feature collection
    featureCollection.remove();

    if (featureCollection === this.selectedCollection) {
      // Unselect the feature collection if it was active
      this.selectedCollection = null;
    }

    // Trigger callbacks
    this.deleteCallbacks.forEach(callback => callback(featureCollection));
  }

  /**
   * Called when a feature collections's information has been updated
   * @param featureCollection The feature collection that has been updated
   */
  updateFeatureCollection(featureCollection: EditableFeatureCollection) {
    // Trigger callbacks
    this.updateCallbacks.forEach(callback => callback(featureCollection));
  }

  /**
   * Change the selected feature collection
   * @param featureCollection The selected feature collection, or null to unselect all feature collections
   */
  selectFeatureCollection(featureCollection: EditableFeatureCollection | null) {
    if (featureCollection === this.selectedCollection) {
      // Do nothing if the feature collection has been selected already
      return;
    }

    if (this.selectedCollection) {
      // Unselect the previously active feature collection
      this.selectedCollection.select(false);
    }

    this.selectedCollection = featureCollection;

    // Trigger callbacks
    this.selectCallbacks.forEach(callback => callback(featureCollection));

    if (featureCollection) {
      // Mark the collection as selected
      featureCollection.select(true);
    }
  }

  /**
   * Add a callback for whenever the selected feature collection changes
   * @param callback A function called with the new active feature collection
   */
  addSelectCallback(callback: FeatureCollectionSelectCallback) {
    this.selectCallbacks.push(callback);
  }

  /**
   * Add a callback for whenever a feature collection is deleted
   * @param callback A function called with the deleted feature collection
   */
  addDeleteCallback(callback: FeatureCollectionChangeCallback) {
    this.deleteCallbacks.push(callback);
  }

  /**
   * Add a callback for whenever a feature collection is updated
   * @param callback A function called with the updated feature collection
   */
  addUpdateCallback(callback: FeatureCollectionChangeCallback) {
    this.updateCallbacks.push(callback);
  }
}

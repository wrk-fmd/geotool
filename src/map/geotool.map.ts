import {control, latLngBounds, Map, tileLayer} from "leaflet";

import {FeatureSetConfig, ImageOverlayConfig} from "../config";
import {FeatureSet, ImageFeatureSet} from "../feature-set";
import {FileListener} from "../file";
import {ActionsControl} from "./actions.control";
import {FeatureSetsControl} from "./feature.sets.control";

export type FeatureSetSelectCallback = (featureSet: FeatureSet | null) => void;
export type FeatureSetChangeCallback = (featureSet: FeatureSet) => void;

/**
 * This class acts as an entry point to the application and displays the map and controls
 */
export class GeotoolMap extends Map {

  private static readonly basemapAttribution = 'Grundkarte: <a href="https://www.basemap.at" target="_blank">basemap.at</a>,'
    + ' <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank">CC-BY 4.0</a>';
  private static readonly basemapSubdomains = ['maps', 'maps1', 'maps2', 'maps3', 'maps4'];
  private static readonly basemapBounds = latLngBounds([46.358770, 8.782379], [49.037872, 17.5]);

  private readonly controls: ActionsControl;
  private readonly featureSets: FeatureSetsControl;

  private selectedSet: FeatureSet | null = null;

  private selectCallbacks: FeatureSetSelectCallback[] = [];
  private deleteCallbacks: FeatureSetChangeCallback[] = [];
  private updateCallbacks: FeatureSetChangeCallback[] = [];

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

    // Create controls for the feature sets
    this.featureSets = new FeatureSetsControl({position: "bottomleft"}).addTo(this);
    this.controls = new ActionsControl({position: "bottomleft"}).addTo(this);

    // Listen for dropped files
    new FileListener(document.body, config => this.addFeatureSet(config));

    // Focus the map so keyboard navigation can be used
    this.getContainer().focus();
  }

  /**
   * Add a feature set to the map
   * @param config The config object containing the relevant parameters for the feature set
   */
  addFeatureSet(config: FeatureSetConfig) {
    let featureSet;
    switch (config.type) {
      case "image":
        featureSet = new ImageFeatureSet(<ImageOverlayConfig>config, this);
        break;
      default:
        window.alert("Could not create layer from invalid config");
        return;
    }

    // Add it to the feature sets control and immediately select it
    this.featureSets.addFeatureSet(featureSet);
    this.selectFeatureSet(featureSet);
  }

  /**
   * Completely remove a feature set from the map
   * @param featureSet The feature set to delete
   */
  deleteFeatureSet(featureSet: FeatureSet) {
    // Call the destruction logic of the feature set
    featureSet.remove();

    if (featureSet === this.selectedSet) {
      // Unselect the feature set if it was active
      this.selectedSet = null;
    }

    // Trigger callbacks
    this.deleteCallbacks.forEach(callback => callback(featureSet));
  }

  /**
   * Called when a feature set's information should be updated
   */
  updateFeatureSet(featureSet: FeatureSet) {
    // Trigger callbacks
    this.updateCallbacks.forEach(callback => callback(featureSet));
  }

  /**
   * Change the selected feature set
   * @param featureSet The selected feature set, or null to unselect all feature sets
   */
  selectFeatureSet(featureSet: FeatureSet | null) {
    if (featureSet === this.selectedSet) {
      // Do nothing if the feature set has been selected already
      return;
    }

    if (this.selectedSet) {
      // Unselect the previously active feature set
      this.selectedSet.select(false);
    }

    this.selectedSet = featureSet;

    // Trigger callbacks
    this.selectCallbacks.forEach(callback => callback(featureSet));

    if (featureSet) {
      // Mark the set as selected
      featureSet.select(true);
    }
  }

  /**
   * Add a callback for whenever the selected feature set changes
   * @param callback A function called with the new active feature set
   */
  addSelectCallback(callback: FeatureSetSelectCallback) {
    this.selectCallbacks.push(callback);
  }

  /**
   * Add a callback for whenever a feature set is deleted
   * @param callback A function called with the deleted feature set
   */
  addDeleteCallback(callback: FeatureSetChangeCallback) {
    this.deleteCallbacks.push(callback);
  }

  /**
   * Add a callback for whenever a feature set is updated
   * @param callback A function called with the updated feature set
   */
  addUpdateCallback(callback: FeatureSetChangeCallback) {
    this.updateCallbacks.push(callback);
  }
}

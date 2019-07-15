import {control, latLngBounds, Map, tileLayer} from "leaflet";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import "leaflet-editable";

import {EditableFeatureCollection} from "../editable";
import {FileListener} from "../file";
import {NamedFeatureCollection} from "../geojson";
import {ActionsControl} from "./actions.control";
import {FeatureCollectionsControl} from "./feature.collections.control";

/**
 * Declare some types for leaflet-editable (the @types package is incompatible with the current Leaflet version)
 */
declare module "leaflet" {
  interface MapOptions {
    editable?: boolean;
  }
}

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

  private readonly _selectedCollection = new BehaviorSubject<EditableFeatureCollection | null>(null);
  private readonly _deletedCollection = new Subject<EditableFeatureCollection>();

  constructor(selector: string) {
    super(selector, {
      center: [48.21, 16.37],
      zoom: 15,
      editable: true
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

  get selectedCollection(): Observable<EditableFeatureCollection | null> {
    return this._selectedCollection;
  }

  get deletedCollection(): Observable<EditableFeatureCollection> {
    return this._deletedCollection;
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

    if (featureCollection === this._selectedCollection.value) {
      // Unselect the feature collection if it was active
      this._selectedCollection.next(null);
    }

    // Trigger callbacks
    this._deletedCollection.next(featureCollection);
  }

  /**
   * Change the selected feature collection
   * @param featureCollection The selected feature collection, or null to unselect all feature collections
   */
  selectFeatureCollection(featureCollection: EditableFeatureCollection | null) {
    if (featureCollection === this._selectedCollection.value) {
      // Do nothing if the feature collection has been selected already
      return;
    }

    if (this._selectedCollection.value) {
      // Unselect the previously active feature collection
      this._selectedCollection.value.select(false);
    }

    // Trigger callbacks
    this._selectedCollection.next(featureCollection);

    if (featureCollection) {
      // Mark the collection as selected
      featureCollection.select(true);
    }
  }
}

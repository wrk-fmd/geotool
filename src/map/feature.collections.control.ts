import {Subscription} from "rxjs";

import {Control, DomEvent, DomUtil} from "leaflet";
import "leaflet-easybutton";

import {EditableFeatureCollection} from "../editable";
import {KeyEvents} from "../util";
import {GeotoolMap} from "./geotool.map";

/**
 * This class shows a control for switching the currently selected feature collection
 */
export class FeatureCollectionsControl extends Control {

  private map?: GeotoolMap;
  private container?: HTMLElement;
  private section?: HTMLElement;

  private featureCollections: CollectionListEntry[] = [];
  private selectedCollection: EditableFeatureCollection | null = null;

  /**
   * Add this control element to a map and set callbacks for selecting, deleting and updating feature collections
   * @param map The map the feature collections are shown on
   */
  onAdd(map: GeotoolMap): HTMLElement {
    this.map = map;

    // Create HTML containers
    this.container = DomUtil.create('div', "leaflet-control-layers");
    this.section = DomUtil.create('section', 'leaflet-control-layers-list', this.container);

    // Disable propagation of events back to the map
    DomEvent.disableClickPropagation(this.container);
    DomEvent.disableScrollPropagation(this.container);

    // Add initial list content
    this.featureCollections.forEach(item => this.addItem(item));

    // Attach callbacks to the map
    this.map.selectedCollection.subscribe(f => this.afterFeatureCollectionSelected(f));
    this.map.deletedCollection.subscribe(f => this.afterFeatureCollectionDeleted(f));

    DomEvent.on(document.body, "keydown", e => this.onKeyDown(e));

    return this.container;
  }

  /**
   * Handle keyboard shortcuts
   * @param e The keyboard event
   */
  private onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent) || KeyEvents.isTextElement(e) || !this.featureCollections.length || !this.map) {
      return;
    }

    let update;
    switch (e.key) {
      case "<":
        update = -1;
        break;
      case ">":
        update = 1;
        break;
      default:
        return;
    }

    let newIndex;
    if (this.selectedCollection) {
      newIndex = this.featureCollections.findIndex(item => item.collection === this.selectedCollection) + update;
      if (newIndex < 0) {
        newIndex = this.featureCollections.length + newIndex;
      } else if (newIndex >= this.featureCollections.length) {
        newIndex = newIndex - this.featureCollections.length;
      }
    } else if (update < -1) {
      newIndex = this.featureCollections.length - 1;
    } else {
      newIndex = 0;
    }

    this.map.selectFeatureCollection(this.featureCollections[newIndex].collection);
  }

  /**
   * Add a feature collection to the list
   * @param featureCollection The new added feature collection
   */
  addFeatureCollection(featureCollection: EditableFeatureCollection) {
    const item = {collection: featureCollection};
    this.featureCollections.push(item);
    this.addItem(item);
  }

  /**
   * Add an item to the DOM
   * @param item The item information
   */
  private addItem(item: CollectionListEntry) {
    if (!this.container || !this.section) {
      return;
    }

    DomUtil.addClass(this.container, "leaflet-control-layers-expanded");
    const label = DomUtil.create("label", "", this.section);

    const input = <HTMLInputElement>DomUtil.create("input", "leaflet-control-layers-selector", label);
    input.type = "radio";
    input.checked = item.collection === this.selectedCollection;
    input.name = "feature-collection-select";
    DomEvent.on(input, 'click', () => this.onSelect(item.collection, input.checked));

    const name = DomUtil.create("span", "", label);
    item.nameSubscription = item.collection.name.subscribe(value => name.innerText = value || "");

    item.element = label;
    item.input = input;
  }

  /**
   * Triggered when the state of a radio button is changed
   * @param featureCollection The feature collection associated with the clicked button
   * @param selected Whether the button has been selected or unselected
   */
  private onSelect(featureCollection: EditableFeatureCollection, selected: boolean) {
    if (!this.map) {
      return;
    }

    if (featureCollection === this.selectedCollection) {
      if (!selected) {
        this.map.selectFeatureCollection(null);
      }
    } else if (selected) {
      this.map.selectFeatureCollection(featureCollection);
    }
  }


  /**
   * Set the selection status of the input element associated with one feature collection
   * @param featureCollection The feature collection
   * @param selected Whether the button should be active or not
   */
  private setSelected(featureCollection: EditableFeatureCollection, selected: boolean) {
    const item = this.featureCollections.find(s => s.collection === featureCollection);
    if (item && item.input) {
      item.input.checked = selected;
    }
  }

  /**
   * Callback called by the map after a feature collection has been selected
   * @param featureCollection The new active feature collection, or null if none has been selected
   */
  private afterFeatureCollectionSelected(featureCollection: EditableFeatureCollection | null) {
    if (featureCollection === this.selectedCollection) {
      // Selected feature collection has not changed, do nothing
      return;
    }

    if (this.selectedCollection) {
      // Uncheck the old selected collection
      this.setSelected(this.selectedCollection, false);
    }

    if (featureCollection) {
      // Check the new selected feature collection
      this.setSelected(featureCollection, true);
    }

    // Set the new active feature collection
    this.selectedCollection = featureCollection;
  }

  /**
   * Callback called by the map after a feature collection has been deleted
   * @param featureCollection The deleted feature collection
   */
  private afterFeatureCollectionDeleted(featureCollection: EditableFeatureCollection) {
    this.featureCollections
      .filter(item => item.collection === featureCollection)
      .forEach(item => {
        if (item.nameSubscription) {
          item.nameSubscription.unsubscribe();
        }
        if (item.element) {
          item.element.remove();
        }
      });

    if (featureCollection === this.selectedCollection) {
      this.selectedCollection = null;
    }

    this.featureCollections = this.featureCollections.filter(item => item.collection !== featureCollection);
    if (!this.featureCollections.length && this.container) {
      DomUtil.removeClass(this.container, "leaflet-control-layers-expanded");
    }
  }
}

interface CollectionListEntry {
  collection: EditableFeatureCollection;
  element?: HTMLElement;
  input?: HTMLInputElement;
  nameSubscription?: Subscription;
}

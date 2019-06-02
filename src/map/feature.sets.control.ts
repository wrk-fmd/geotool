import {Control, DomEvent, DomUtil} from "leaflet";
import "leaflet-easybutton";

import {FeatureSet} from "../feature-set";
import {GeotoolMap} from "./geotool.map";

/**
 * This class shows a control for switching the currently selected feature set
 */
export class FeatureSetsControl extends Control {

  private map?: GeotoolMap;
  private container?: HTMLElement;
  private section?: HTMLElement;

  private featureSets: SetListEntry[] = [];
  private selectedSet: FeatureSet | null = null;

  /**
   * Add this control element to a map and set callbacks for selecting, deleting and updating feature sets
   * @param map The map the feature sets are shown on
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
    this.featureSets.forEach(item => this.addItem(item));

    // Attach callbacks to the map
    this.map.addSelectCallback(f => this.afterFeatureSetSelected(f));
    this.map.addDeleteCallback(f => this.afterFeatureSetDeleted(f));
    this.map.addUpdateCallback(f => this.afterFeatureSetUpdated(f));

    DomEvent.on(document.body, "keydown", e => this.onKeyDown(e));

    return this.container;
  }

  /**
   * Handle keyboard shortcuts
   * @param e The keyboard event
   */
  private onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent) || !this.featureSets.length || !this.map) {
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
    if (this.selectedSet) {
      newIndex = this.featureSets.findIndex(item => item.set === this.selectedSet) + update;
      if (newIndex < 0) {
        newIndex = this.featureSets.length + newIndex;
      } else if (newIndex >= this.featureSets.length) {
        newIndex = newIndex - this.featureSets.length;
      }
    } else if (update < -1) {
      newIndex = this.featureSets.length - 1;
    } else {
      newIndex = 0;
    }

    this.map.selectFeatureSet(this.featureSets[newIndex].set);
  }

  /**
   * Add a feature set to the list
   * @param featureSet The new added feature set
   */
  addFeatureSet(featureSet: FeatureSet) {
    const item = {set: featureSet};
    this.featureSets.push(item);
    this.addItem(item);
  }

  /**
   * Add an item to the DOM
   * @param item The item information
   */
  private addItem(item: SetListEntry) {
    if (!this.container || !this.section) {
      return;
    }

    DomUtil.addClass(this.container, "leaflet-control-layers-expanded");
    const label = DomUtil.create("label", "", this.section);

    const input = <HTMLInputElement>DomUtil.create("input", "leaflet-control-layers-selector", label);
    input.type = "radio";
    input.checked = item.set === this.selectedSet;
    input.name = "feature-set-select";
    DomEvent.on(input, 'click', () => this.onSelect(item.set, input.checked));

    const name = DomUtil.create("span", "", label);
    name.innerText = item.set.name;

    item.element = label;
    item.input = input;
    item.name = name;
  }

  /**
   * Triggered when the state of a radio button is changed
   * @param featureSet The feature set associated with the clicked button
   * @param selected Whether the button has been selected or unselected
   */
  private onSelect(featureSet: FeatureSet, selected: boolean) {
    if (!this.map) {
      return;
    }

    if (featureSet === this.selectedSet) {
      if (!selected) {
        this.map.selectFeatureSet(null);
      }
    } else if (selected) {
      this.map.selectFeatureSet(featureSet);
    }
  }


  /**
   * Set the selection status of the input element associated with one feature set
   * @param featureSet The feature set
   * @param selected Whether the button should be active or not
   */
  private setSelected(featureSet: FeatureSet, selected: boolean) {
    const item = this.featureSets.find(s => s.set === featureSet);
    if (item && item.input) {
      item.input.checked = selected;
    }
  }

  /**
   * Callback called by the map after a feature set has been selected
   * @param featureSet The new active feature set, or null if none has been selected
   */
  private afterFeatureSetSelected(featureSet: FeatureSet | null) {
    if (featureSet === this.selectedSet) {
      // Selected feature set has not changed, do nothing
      return;
    }

    if (this.selectedSet) {
      // Uncheck the old selected set
      this.setSelected(this.selectedSet, false);
    }

    if (featureSet) {
      // Check the new selected feature set
      this.setSelected(featureSet, true);
    }

    // Set the new active feature set
    this.selectedSet = featureSet;
  }

  /**
   * Callback called by the map after a feature set has been deleted
   * @param featureSet The deleted feature set
   */
  private afterFeatureSetDeleted(featureSet: FeatureSet) {
    this.featureSets
      .filter(item => item.set === featureSet)
      .forEach(item => {
        if (item.element) {
          item.element.remove()
        }
      });

    if (featureSet === this.selectedSet) {
      this.selectedSet = null;
    }

    this.featureSets = this.featureSets.filter(item => item.set !== featureSet);
    if (!this.featureSets.length && this.container) {
      DomUtil.removeClass(this.container, "leaflet-control-layers-expanded");
    }
  }

  /**
   * Callback called by the map after a feature set has been updated
   * @param featureSet The updated feature set
   */
  private afterFeatureSetUpdated(featureSet: FeatureSet) {
    this.featureSets
      .filter(item => item.set === featureSet)
      .forEach(item => {
        if (item.name) {
          item.name.innerText = featureSet.name;
        }
      });
  }
}

interface SetListEntry {
  set: FeatureSet;
  element?: HTMLElement;
  input?: HTMLInputElement;
  name?: HTMLElement;
}

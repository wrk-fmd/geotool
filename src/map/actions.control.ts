import {Control, ControlOptions, DomEvent, Map} from "leaflet";
import "leaflet-easybutton";

import {ActionButton, ControlButton} from "../button";
import {EditableFeatureCollection} from "../editable";
import {KeyEvents} from "../util";
import {GeotoolMap} from "./geotool.map";

/**
 * Some extensions to the TS definition of Leaflet Easybutton classes
 */
declare module "leaflet" {
  namespace Control {
    interface EasyButton {
      _bar: EasyBar | null;
      _container: HTMLElement | null;
      _map: Map | null
      button: HTMLElement;
    }

    interface EasyBar {
      _buttons: EasyButton[];
    }
  }
}

/**
 * This class displays control buttons for modifying feature collection
 */
export class ActionsControl extends Control.EasyBar {

  private map?: GeotoolMap;

  private buttons: Control.EasyButton[];
  private buttonsAdded: boolean = false;

  private selectedCollection: EditableFeatureCollection | null = null;

  constructor(options?: ControlOptions) {
    // @ts-ignore The TS definition for the base constructor does not match the actual JS as of leaflet-easybutton 2.4.0
    super([], options);

    this.addButton(new ActionButton("fa-plus", () => this.createFeatureCollection(), "Create new feature collection [Ins]", "Insert"));

    // Create buttons which are only shown when a layer is selected
    this.buttons = [
      new ActionButton("fa-sign-out-alt", () => this.unselectFeatureCollection(), "Unselect feature collection [Esc]", "Escape"),
      new ActionButton("fa-edit", () => this.editFeatureCollection(), "Edit active feature collection [N]", "n"),
      new ActionButton("fa-trash-alt", () => this.deleteFeatureCollection(), "Delete active feature collection [Del]", "Delete"),
      new ActionButton("fa-download", () => this.download(), "Export the active feature collection [E]", "e"),
    ];

    DomEvent.on(document.body, "keydown", e => this.onKeyDown(e));
  }

  /**
   * Add this control element to a map and set callbacks for selecting and deleting feature collections
   * @param map The map the controls are shown on
   */
  addTo(map: GeotoolMap): this {
    this.map = map;
    this.map.selectedCollection.subscribe(f => this.afterFeatureCollectionSelected(f));
    return super.addTo(map);
  }

  /**
   * Handle keyboard shortcuts
   * @param e The keyboard event
   */
  private onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent) || KeyEvents.isTextElement(e)) {
      return;
    }

    this._buttons
      .filter(b => b instanceof ControlButton && b.getKey() === e.key)
      .forEach(b => (<ControlButton>b).onKeyDown());
  }

  private createFeatureCollection() {
    if (this.map) {
      this.map.addFeatureCollection({
        type: "FeatureCollection",
        features: [],
        name: "New feature collection"
      })
    }
  }

  /**
   * Unselect the active feature collection
   */
  private unselectFeatureCollection() {
    if (this.map) {
      this.map.selectFeatureCollection(null);
    }
  }

  /**
   * Rename the active feature collection
   */
  private editFeatureCollection() {
    if (this.selectedCollection) {
      this.selectedCollection.edit();
    }
  }

  /**
   * Delete the active feature collection after asking for confirmation
   */
  private deleteFeatureCollection() {
    if (!this.selectedCollection || !this.map) {
      return;
    }

    const response = window.confirm(`Do you really want to delete "${this.selectedCollection.name.value}" completely?`);
    if (response) {
      this.map.deleteFeatureCollection(this.selectedCollection);
    }
  }

  /**
   * Export the active feature collection
   */
  private download() {
    if (this.selectedCollection) {
      this.selectedCollection.download();
    }
  }

  /**
   * Callback called by the map after a feature collection has been selected
   * @param featureCollection The new active feature collection, or null if none has been selected
   */
  private afterFeatureCollectionSelected(featureCollection: EditableFeatureCollection | null) {
    if (featureCollection === this.selectedCollection) {
      // Active feature collection has not changed, do nothing
      return;
    }

    if (this.selectedCollection) {
      // Remove the buttons of the previously active feature collection
      this.selectedCollection.getControls().forEach(button => this.removeButton(button));
    }

    if (featureCollection) {
      // Add buttons for the new active feature collection
      this.showButtons(true);
      featureCollection.getControls().forEach(button => this.addButton(button));
    } else {
      // Remove all buttons
      this.showButtons(false);
    }

    // Set the new active feature collection
    this.selectedCollection = featureCollection;
  }

  /**
   * Show or hide the conditional buttons
   * @param show Whether the buttons should be shown or hidden
   */
  private showButtons(show: boolean) {
    if (show !== this.buttonsAdded) {
      // Only add/remove if the status has changed
      this.buttons.forEach(button => show ? this.addButton(button) : this.removeButton(button));
      this.buttonsAdded = show;
    }
  }

  /**
   * Add a button to the bar
   * @param button The button to add
   */
  private addButton(button: Control.EasyButton) {
    button._bar = this;
    button._container = button.button;
    button._map = this.map!;

    this._buttons.push(button);
    this.getContainer()!.appendChild(button.button);
  }

  /**
   * Remove a button from the bar
   * @param button The button to remove
   */
  private removeButton(button: Control.EasyButton) {
    button._bar = null;
    button._container = null;
    button._map = null;

    this._buttons = this._buttons.filter(item => item !== button);
    this.getContainer()!.removeChild(button.button);
  }
}

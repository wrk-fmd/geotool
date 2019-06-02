import {Control, ControlOptions, DomEvent, Map} from "leaflet";
import "leaflet-easybutton";

import {ActionButton, ControlButton} from "../button";
import {FeatureSet} from "../feature-set";
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
 * This class displays control buttons for modifying feature sets
 */
export class ActionsControl extends Control.EasyBar {

  private map?: GeotoolMap;

  private buttons: Control.EasyButton[];
  private buttonsAdded: boolean = false;

  private selectedSet: FeatureSet | null = null;

  constructor(options?: ControlOptions) {
    // @ts-ignore The TS definition for the base constructor does not match the actual JS as of leaflet-easybutton 2.4.0
    super([], options);

    // Create buttons which are only shown when a layer is selected
    this.buttons = [
      new ActionButton("fa-sign-out-alt", () => this.unselectFeatureSet(), "Unselect feature set [Esc]", "Escape"),
      new ActionButton("fa-edit", () => this.renameFeatureSet(), "Rename active feature set [N]", "n"),
      new ActionButton("fa-trash-alt", () => this.deleteFeatureSet(), "Delete active feature set [Del]", "Delete"),
      new ActionButton("fa-download", () => this.download(), "Export the active feature set [E]", "e"),
    ];

    DomEvent.on(document.body, "keydown", e => this.onKeyDown(e));
  }

  /**
   * Add this control element to a map and set callbacks for selecting and deleting feature sets
   * @param map The map the controls are shown on
   */
  addTo(map: GeotoolMap): this {
    this.map = map;
    this.map.addSelectCallback(f => this.afterFeatureSetSelected(f));
    this.map.addDeleteCallback(f => this.afterFeatureSetDeleted(f));
    return super.addTo(map);
  }

  /**
   * Handle keyboard shortcuts
   * @param e The keyboard event
   */
  private onKeyDown(e: Event) {
    if (!(e instanceof KeyboardEvent)) {
      return;
    }

    this._buttons
      .filter(b => b instanceof ControlButton && b.getKey() === e.key)
      .forEach(b => (<ControlButton>b).onKeyDown());
  }

  /**
   * Unselect the active feature set
   */
  private unselectFeatureSet() {
    if (this.map) {
      this.map.selectFeatureSet(null);
    }
  }

  /**
   * Rename the active feature set
   */
  private renameFeatureSet() {
    if (!this.selectedSet) {
      return;
    }

    const newName = window.prompt("Enter a new name for the feature set:", this.selectedSet.name);
    if (newName) {
      this.selectedSet.name = newName;
      if (this.map) {
        this.map.updateFeatureSet(this.selectedSet);
      }
    }
  }

  /**
   * Delete the active feature set after asking for confirmation
   */
  private deleteFeatureSet() {
    if (!this.selectedSet || !this.map) {
      return;
    }

    const response = window.confirm(`Do you really want to delete "${this.selectedSet.name}" completely?`);
    if (response) {
      this.map.deleteFeatureSet(this.selectedSet);
    }
  }

  /**
   * Export the active feature set
   */
  private download() {
    if (this.selectedSet) {
      this.selectedSet.download();
    }
  }

  /**
   * Callback called by the map after a feature set has been selected
   * @param featureSet The new active feature set, or null if none has been selected
   */
  private afterFeatureSetSelected(featureSet: FeatureSet | null) {
    if (featureSet === this.selectedSet) {
      // Active feature set has not changed, do nothing
      return;
    }

    if (this.selectedSet) {
      // Remove the buttons of the previously active feature set
      this.selectedSet.getControls().forEach(button => this.removeButton(button));
    }

    if (featureSet) {
      // Add buttons for the new active feature set
      this.showButtons(true);
      featureSet.getControls().forEach(button => this.addButton(button));
    } else {
      // Remove all buttons
      this.showButtons(false);
    }

    // Set the new active feature set
    this.selectedSet = featureSet;
  }

  /**
   * Callback called by the map after a feature set has been deleted
   * @param featureSet The deleted feature set
   */
  private afterFeatureSetDeleted(featureSet: FeatureSet) {
    if (featureSet === this.selectedSet) {
      // Feature set was active, so unselect it
      this.afterFeatureSetSelected(null);
    }
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

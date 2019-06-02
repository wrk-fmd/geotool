import {Control} from "leaflet";
import "leaflet-easybutton";

import {FeatureSetConfig} from "../config";

/**
 * This class is the base for a set of features (e.g. image overlay or POIs) to be displayed in a map
 */
export abstract class FeatureSet {

  protected readonly controls: { [key: string]: Control.EasyButton } = {};

  protected constructor(protected readonly config: FeatureSetConfig) {
  }

  /**
   * The displayed name of this feature set
   */
  get name(): string {
    return this.config.name;
  }

  set name(name: string) {
    this.config.name = name;
  }

  /**
   * The additional buttons for this type of feature set
   */
  getControls(): Control.EasyButton[] {
    return Object.values(this.controls);
  }

  /**
   * Called when the feature set is (un)selected on the map
   * @param selected Whether the feature set is now selected or not
   */
  abstract select(selected: boolean): void;

  /**
   * Completely remove this feature set and destroy all resources
   */
  abstract remove(): void;

  /**
   * Export the data of this feature set
   */
  abstract download(): void;
}

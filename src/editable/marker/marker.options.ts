import {BehaviorSubject} from "rxjs";

import {Hash} from "../../util";

/**
 * A class containing the options for a marker as Observables
 */
export class MarkerOptions {

  /** The text for the marker */
  readonly text: BehaviorSubject<string | null>;

  /** The color for the marker (as hex RGB value) */
  readonly color: BehaviorSubject<string | null>;

  /** The icon for the marker (as CSS class, e.g. fa-*) */
  readonly icon: BehaviorSubject<string | null>;

  /** The horizontal anchor for the icon (as relative offset to the center) */
  readonly hAnchor: BehaviorSubject<string | null>;

  /** The vertical anchor for the icon (as relative offset to the bottom) */
  readonly vAnchor: BehaviorSubject<string | null>;

  constructor(defaults?: Hash<string>) {
    defaults = defaults || {};
    this.text = new BehaviorSubject(defaults.text || null);
    this.color = new BehaviorSubject(defaults.color || null);
    this.icon = new BehaviorSubject(defaults.icon || null);
    this.hAnchor = new BehaviorSubject(defaults.hAnchor || null);
    this.vAnchor = new BehaviorSubject(defaults.vAnchor || null);
  }

  /**
   * Get the current values as a static object
   * @return A hash containing the current values, omitting unset values
   */
  getValues(): Hash<any> {
    const values: Hash<string> = {};

    if (this.text.value) {
      values.text = this.text.value;
    }
    if (this.color.value) {
      values.color = this.color.value;
    }
    if (this.icon.value) {
      values.icon = this.icon.value;
    }
    if (this.hAnchor.value) {
      values.hAnchor = this.hAnchor.value;
    }
    if (this.vAnchor.value) {
      values.vAnchor = this.vAnchor.value;
    }

    return values;
  }
}

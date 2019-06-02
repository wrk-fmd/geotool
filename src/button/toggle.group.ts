import {ToggleButton} from "./toggle.button";

export type ToggleGroupOptions = {
  [id: string]: { icon: string, titleInactive?: string, titleActive?: string, key?: string }
};

/**
 * This class groups multiple toggle buttons together, where only one can be active at a time
 */
export class ToggleGroup {

  readonly buttons: { [key: string]: ToggleButton } = {};
  private _active: string | null = null;

  /**
   * Create a new group of buttons
   * @param options An array containing the options for buttons to be created
   * @param onChange
   */
  constructor(options: ToggleGroupOptions, private readonly onChange: (active: string | null) => void) {
    Object.keys(options).forEach(id => {
      const opt = options[id];
      this.buttons[id] = new ToggleButton(
        opt.icon, active => this.setActive(id, active), opt.titleInactive, opt.titleActive, opt.key, id
      );
    });
  }

  get active(): string | null {
    return this._active;
  }

  /**
   * Set the currently active button
   * @param active The id of the new active button, or null to deactivate all buttons
   */
  set active(active: string | null) {
    if (active !== this._active) {
      const previous = this._active;
      this._active = active;

      if (previous && this.buttons[previous] && this.buttons[previous].active) {
        this.buttons[previous].active = false;
      }
      if (active && this.buttons[active] && !this.buttons[active].active) {
        this.buttons[active].active = true;
      }

      this.onChange(active);
    }
  }

  private setActive(id: string, active: boolean) {
    if (active) {
      this.active = id;
    } else if (this.active === id) {
      this.active = null;
    }
  }
}

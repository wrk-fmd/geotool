import {ControlButton} from "./control.button";

/**
 * This button has two states, which can be toggled
 */
export class ToggleButton extends ControlButton {

  private _active: boolean = false;

  /**
   * Create a new button
   * @param icon The icon HTML or CSS class
   * @param onStateChange The callback when the state changes, which gives the new state as parameter
   * @param titleInactive The optional title of the button when it is inactive
   * @param titleActive The optional title of the button when it is active
   * @param key The optional key this button is bound to
   * @param id The optional id of the button
   */
  constructor(icon: string, private readonly onStateChange: (active: boolean) => void,
    titleInactive?: string, titleActive?: string, key?: string, id?: string) {
    super(
      icon, [
        {
          stateName: "inactive",
          onClick: () => this.active = true,
          title: titleInactive || "Inactive",
          icon: icon
        },
        {
          stateName: "active",
          onClick: () => this.active = false,
          title: titleActive || "Active",
          icon: icon
        }
      ], key, id
    );
  }

  get active(): boolean {
    return this._active;
  }

  set active(active: boolean) {
    if (active !== this._active) {
      this._active = active;
      this.state(active ? "active" : "inactive");
      this.onStateChange(active);
    }
  }

  onKeyDown() {
    this.active = !this._active;
  }
}

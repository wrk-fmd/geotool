import {Control, EasyButtonState} from "leaflet";
import "leaflet-easybutton";

/**
 * This button has some extra functionality compared to EasyButton and is used as base class for more specific buttons
 */
export class ControlButton extends Control.EasyButton {

  /**
   * Create a new button
   * @param icon The icon HTML or CSS class
   * @param states The available states of the button, which also include click handlers
   * @param key The optional key this button is bound to
   * @param id The optional id of the button
   */
  constructor(icon: string, states: EasyButtonState[], private readonly key?: string, id?: string) {
    super({
      id: id,
      tagName: "a",
      states
    });
  }

  /**
   * Get the key associated with this button
   * @return The key, or null if none is bound
   */
  getKey(): string | null {
    return this.key || null;
  }

  /**
   * The event triggered when the key is pressed
   */
  onKeyDown() {
  }
}

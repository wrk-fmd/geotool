import {ControlButton} from "./control.button";

/**
 * This button only has a single state and can be used to trigger actions
 */
export class ActionButton extends ControlButton {

  /**
   * Create a new button
   * @param icon The icon HTML or CSS class
   * @param onClick The callback on clicking the button
   * @param title The optional title of the button
   * @param key The optional key this button is bound to
   * @param id The optional id of the button
   */
  constructor(icon: string, private readonly onClick: () => void, title?: string, key?: string, id?: string) {
    super(icon, [
        {
          stateName: "action",
          onClick: onClick,
          title: title || "",
          icon: icon
        }
      ], key, id
    );
  }

  onKeyDown() {
    this.onClick();
  }
}

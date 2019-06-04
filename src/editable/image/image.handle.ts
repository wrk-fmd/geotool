import {divIcon, LatLng, Marker} from "leaflet";

import {EditableImageOverlay} from "./editable.image.overlay";
import {CornerNumber} from "./transformed.image.overlay";

export type ImageHandleMode = "scale" | "rotate" | "distort";

/**
 * This class provides handles for the corner of image overlays
 */
export class ImageHandle extends Marker {

  private static scaleIcon = divIcon({
    iconSize: [24, 24],
    className: "",
    html: '<i class="fas fa-arrows-alt-h fa-2x"></i>'
  });
  private static rotateIcon = divIcon({
    iconSize: [24, 24],
    className: "",
    html: '<i class="fas fa-sync fa-2x"></i>'
  });
  private static distortIcon = divIcon({
    iconSize: [24, 24],
    className: "",
    html: '<i class="fas fa-circle fa-2x"></i>'
  });

  private mode: ImageHandleMode = "distort";
  private previousLatlng: LatLng;

  /**
   * Construct a new handle
   * @param image The feature set to attach to
   * @param corner The number of the corner (1..3)
   * @param latlng The initial position of the handle
   */
  constructor(private readonly image: EditableImageOverlay, private readonly corner: CornerNumber, latlng: LatLng) {
    super(latlng, {icon: ImageHandle.scaleIcon, draggable: true,});

    this.previousLatlng = latlng;
    this.on("drag", () => this.onDrag());
  }

  /**
   * Get the coordinates before a drag operation was started
   */
  get latlng(): LatLng {
    return this.previousLatlng;
  }

  /**
   * Update the coordinates of the handle
   * @param latlng The new coordinates
   */
  set latlng(latlng: LatLng) {
    this.previousLatlng = latlng;
    this.setLatLng(latlng);
  }

  /**
   * Change the mode of the handle
   * @param mode The new mode
   */
  setMode(mode: ImageHandleMode) {
    this.mode = mode;
    switch (this.mode) {
      case "scale":
        this.setIcon(ImageHandle.scaleIcon);
        break;
      case "rotate":
        this.setIcon(ImageHandle.rotateIcon);
        break;
      case "distort":
        this.setIcon(ImageHandle.distortIcon);
        break;
    }
  }

  /**
   * Set the angle of this handle
   * @param angle The new angle
   */
  setAngle(angle: number) {
    const el = this.getElement();
    if (!el) {
      return;
    }

    const icon = el.firstChild;
    if (icon instanceof HTMLElement) {
      angle = 180 + angle * 180 / Math.PI;
      icon.style.transform = `rotate(${angle}deg)`
    }
  }

  /**
   * Function triggered when the handle has been dragged
   */
  private onDrag() {
    const latlng = this.getLatLng();
    switch (this.mode) {
      case "scale":
        this.image.scale(this.previousLatlng, latlng);
        break;
      case "rotate":
        this.image.rotate(this.previousLatlng, latlng);
        break;
      case "distort":
        this.image.updateCorner(this.corner, latlng);
    }
  }

  /**
   * Destroy this handle
   */
  remove(): this {
    this.off("drag");
    return super.remove();
  }
}

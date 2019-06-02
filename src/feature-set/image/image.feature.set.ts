import {DomUtil, Draggable, latLng, LatLng, layerGroup, LayerGroup, Map, Point} from "leaflet";

import {ToggleButton, ToggleGroup} from "../../button";
import {ImageOverlayConfig} from "../../config";
import {Coordinates} from "../../config/coordinates";
import {FileDownloader} from "../../file";
import {CanvasWebGL, PointMapping, Projection} from "../../util";
import {FeatureSet} from "../feature.set";
import {ImageHandle} from "./image.handle";
import {CornerNumber, TransformedImageOverlay} from "./transformed.image.overlay";

/**
 * Some extensions to the TS definition of the Leaflet Draggable
 */
declare module "leaflet" {
  interface Draggable {
    _newPos: Point;

    _updatePosition(): void;
  }
}

/**
 * A feature set for displaying an image overlay
 */
export class ImageFeatureSet extends FeatureSet {

  private readonly layer: TransformedImageOverlay;
  private readonly handles: [ImageHandle, ImageHandle, ImageHandle, ImageHandle];
  private readonly handleGroup: LayerGroup;
  private readonly toggleGroup: ToggleGroup;
  private readonly draggable: Draggable;

  /**
   * Create a new image overlay feature set
   * @param config The config for this feature set
   * @param map The map on which the feature set is displayed
   */
  constructor(protected readonly config: ImageOverlayConfig, private readonly map: Map) {
    super(config);

    // Create the image layer and set the coordinates of the corners
    this.layer = new TransformedImageOverlay(config.imageInfo.getSrc(), this.calculateCorners());

    // Add the layer to the map
    this.layer.addTo(map);

    // Add corner handles
    this.handles = <[ImageHandle, ImageHandle, ImageHandle, ImageHandle]>
      this.layer.getCorners().map((latlng, corner) => new ImageHandle(this, <CornerNumber>corner, latlng));
    this.handleGroup = layerGroup(this.handles);

    // Make draggable
    this.draggable = new Draggable(this.layer.getElement()!);
    this.draggable._updatePosition = () => {
      this.move(this.map.latLngToLayerPoint(this.layer.getCorners()[0]), this.draggable._newPos);
    };

    // Add controls
    this.controls.opacity = new ToggleButton(
      "fas fa-adjust",
      active => this.layer.setOpacity(active ? 0.65 : 1),
      "Make image transparent [T]", "Make image opaque [T]", "t"
    );

    this.toggleGroup = new ToggleGroup({
      move: {
        icon: "fas fa-arrows-alt",
        titleInactive: "Move the image [M]",
        titleActive: "Stop moving the image [M]",
        key: "m"
      },
      scale: {
        icon: "fas fa-expand",
        titleInactive: "Scale the image [S]",
        titleActive: "Stop scaling the image [S]",
        key: "s"
      },
      rotate: {
        icon: "fas fa-sync",
        titleInactive: "Rotate the image [R]",
        titleActive: "Stop rotating the image [R]",
        key: "r"
      },
      distort: {
        icon: "fas fa-circle-notch",
        titleInactive: "Distort image freely [D]",
        titleActive: "Stop distorting the image [D]",
        key: "d"
      }
    }, mode => this.setMode(mode));
    Object.assign(this.controls, this.toggleGroup.buttons);
  }

  /**
   * Load the previously configured corner coordinates or calculate them based on the current map view
   */
  private calculateCorners(): [LatLng, LatLng, LatLng, LatLng] {
    if (this.config.corners) {
      // Reuse previously configured corners
      return [
        latLng(this.config.corners[0]),
        latLng(this.config.corners[1]),
        latLng(this.config.corners[2]),
        latLng(this.config.corners[3])
      ]
    }

    // Place the image in the center of the current map view
    const mapSize = this.map.getSize(),
      imgWidth = this.config.imageInfo.width,
      imgHeight = this.config.imageInfo.height,
      minPadding = 2 * 100,
      factor = Math.max(imgWidth / (mapSize.x - minPadding), imgHeight / (mapSize.y - minPadding), 1),
      offsetX = (mapSize.x - imgWidth / factor) / 2,
      offsetY = (mapSize.y - imgHeight / factor) / 2,
      left = offsetX, right = mapSize.x - offsetX,
      top = offsetY, bottom = mapSize.y - offsetY;

    return [
      this.map.containerPointToLatLng([left, top]),
      this.map.containerPointToLatLng([right, top]),
      this.map.containerPointToLatLng([left, bottom]),
      this.map.containerPointToLatLng([right, bottom])
    ];
  }

  /**
   * Set the current mode for editing this feature set
   * @param mode The new mode, or null to disable editing
   */
  private setMode(mode: string | null) {
    let dragging = false;
    switch (mode) {
      case "scale":
      case "rotate":
      case "distort":
        this.handles.forEach(c => c.setMode(mode));
        this.handleGroup.addTo(this.map);
        this.setHandleAngles();
        break;
      case "move":
        this.handleGroup.remove();
        dragging = true;
        break;
      default:
        this.handleGroup.remove();
        break;
    }

    // Make draggable only when "move" is selected
    if (dragging) {
      this.draggable.enable();
      DomUtil.addClass(this.layer.getElement()!, "leaflet-interactive");
      this.layer.getElement()!.style.cursor = "move";
    } else {
      this.draggable.disable();
      DomUtil.removeClass(this.layer.getElement()!, "leaflet-interactive");
      this.layer.getElement()!.style.cursor = "";
    }
  }

  /**
   * Move the image according to the difference between two points
   * @param oldPos The starting point of the drag operation
   * @param newPos The end point of the drag operation
   */
  move(oldPos: Point, newPos: Point) {
    const delta = newPos.subtract(oldPos);
    this.handles.forEach(handle => {
      const p = this.map.latLngToLayerPoint(handle.latlng).add(delta);
      handle.latlng = this.map.layerPointToLatLng(p);
    });
    this.updateLayer();
  }

  /**
   * Scale the image according to the different distances of two points from the center of the image
   * @param oldPos The previous position of a corner
   * @param newPos The new position of a corner
   */
  scale(oldPos: LatLng, newPos: LatLng) {
    const center = this.layer.getCenter()!,
      oldRadius = center.distanceTo(this.map.latLngToLayerPoint(oldPos)),
      newRadius = center.distanceTo(this.map.latLngToLayerPoint(newPos)),
      scale = newRadius / oldRadius;

    this.handles.forEach(handle => {
      const p = this.map.latLngToLayerPoint(handle.latlng).subtract(center).multiplyBy(scale).add(center);
      handle.latlng = this.map.layerPointToLatLng(p);
    });

    this.updateLayer();
  }

  /**
   * Rotate the image according to the angle between two points
   * @param oldPos The previous position of a corner
   * @param newPos The new position of a corner
   */
  rotate(oldPos: LatLng, newPos: LatLng) {
    const center = this.layer.getCenter()!,
      oldAngle = this.calculateAngle(center, this.map.latLngToLayerPoint(oldPos)),
      newAngle = this.calculateAngle(center, this.map.latLngToLayerPoint(newPos)),
      angle = newAngle - oldAngle;

    this.handles.forEach(handle => {
      const p = this.map.latLngToLayerPoint(handle.latlng).subtract(center),
        q = new Point(
          Math.cos(angle) * p.x - Math.sin(angle) * p.y,
          Math.sin(angle) * p.x + Math.cos(angle) * p.y
        ).add(center);
      handle.latlng = this.map.layerPointToLatLng(q);
    });

    this.setHandleAngles();
    this.updateLayer();
  }

  /**
   * Update the position of a single corner
   * @param corner The number of the corner (0..3)
   * @param newPos The new position of the corner
   */
  updateCorner(corner: CornerNumber, newPos: LatLng) {
    this.handles[corner].latlng = newPos;
    this.setHandleAngles();
    this.layer.setCorner(corner, newPos);
  }

  /**
   * Calculate the angle of a line between two points
   * @param a The start of the line
   * @param b The end of the line
   */
  private calculateAngle(a: Point, b: Point): number {
    return Math.atan2(a.y - b.y, a.x - b.x);
  }

  /**
   * Calculate the angle of the bisector between the lines a-b and a-c
   * @param a The point from which the lines start
   * @param b The endpoint of the first line
   * @param c The endpoint of the second line
   */
  private calculateMidAngle(a: Point, b: Point, c: Point): number {
    const dir = this.dirVector(a, b).add(this.dirVector(a, c));
    return Math.atan2(dir.y, dir.x);
  }

  /**
   * Calculate the direction (unit) vector between points
   * @param a The start of the vector
   * @param b The end of the vector
   */
  private dirVector(a: Point, b: Point): Point {
    const dir = b.subtract(a);
    return dir.divideBy(Math.sqrt(dir.x * dir.x + dir.y * dir.y));
  }

  /**
   * Update the angles for each corner handle in order to display the icons in the correct orientation
   */
  private setHandleAngles() {
    const c = this.handles.map(handle => this.map.latLngToLayerPoint(handle.latlng));
    this.handles[0].setAngle(this.calculateMidAngle(c[0], c[1], c[2]));
    this.handles[1].setAngle(this.calculateMidAngle(c[1], c[0], c[3]));
    this.handles[2].setAngle(this.calculateMidAngle(c[2], c[0], c[3]));
    this.handles[3].setAngle(this.calculateMidAngle(c[3], c[1], c[2]));
  }

  /**
   * Update all corners of the image overlay
   */
  private updateLayer() {
    this.layer.setCorners(<[LatLng, LatLng, LatLng, LatLng]>this.handles.map(c => c.latlng));
  }

  /**
   * Called when this feature set is (un)selected
   * @param selected Whether the set has been selected or unselected
   */
  select(selected: boolean) {
    if (selected) {
      (<ToggleButton>this.controls.opacity).active = false;
      this.layer.setOpacity(1);
      this.layer.bringToFront();
      this.map.fitBounds(this.layer.getBounds(), {padding: [30, 30]})
    } else {
      this.toggleGroup.active = null;
      this.layer.setOpacity(0.65);
    }
  }

  /**
   * Remove this feature set completely
   */
  remove() {
    this.handles.forEach(c => c.remove());
    this.handleGroup.remove();
    this.layer.remove();
  }

  /**
   * Export the current image and config of this feature set
   */
  download() {
    this.downloadImage();
    this.downloadConfig();
  }

  private async downloadImage() {
    const c = this.layer.getCorners().map(corner => this.map.latLngToLayerPoint(corner));

    // Bounds of the currently displayed image
    const left = Math.min(c[0].x, c[1].x, c[2].x, c[3].x),
      right = Math.max(c[0].x, c[1].x, c[2].x, c[3].x),
      top = Math.min(c[0].y, c[1].y, c[2].y, c[3].y),
      bottom = Math.max(c[0].y, c[1].y, c[2].y, c[3].y);

    // Dimensions of the currently displayed image
    const width = right - left, height = bottom - top;

    // Map the corners of the displayed image into a unit square
    const target = c.map(c => new Point((c.x - left) / width, (c.y - top) / height));

    // Project the image, using a unit square for both the source and target dimensions
    const transform = Projection.project2D(
      PointMapping.map(0, 0, target[0].x, target[0].y),
      PointMapping.map(1, 0, target[1].x, target[1].y),
      PointMapping.map(0, 1, target[2].x, target[2].y),
      PointMapping.map(1, 1, target[3].x, target[3].y),
    );

    // Scaling factor based on the currently displayed size in order to preserve the full resolution
    const factor = Math.max(
      this.config.imageInfo.width / c[0].distanceTo(c[1]),
      this.config.imageInfo.width / c[2].distanceTo(c[3]),
      this.config.imageInfo.height / c[0].distanceTo(c[2]),
      this.config.imageInfo.height / c[1].distanceTo(c[3])
    );

    // Render the file and download it
    const canvas = new CanvasWebGL(factor * width, factor * height);
    canvas.drawImage(this.layer.getElement()!, transform);
    new FileDownloader(`${this.name}.png`).setBlob(await canvas.getBlob()).download().destroy();
    canvas.destroy();
  }

  /**
   * Download the JSON config file
   */
  private downloadConfig() {
    // Update the local config
    this.config.corners = <[Coordinates, Coordinates, Coordinates, Coordinates]>
      this.layer.getCorners().map(c => [c.lat, c.lng]);

    const bounds = this.layer.getBounds();
    this.config.bounds = [[bounds.getSouth(), bounds.getEast()], [bounds.getNorth(), bounds.getWest()]];

    // Download the JSON file
    const json = JSON.stringify(this.config);
    new FileDownloader(`${this.name}.json`).setString(json).download().destroy();
  }

}

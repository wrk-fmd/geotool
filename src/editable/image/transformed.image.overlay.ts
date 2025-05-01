import {ImageOverlay, ImageOverlayOptions, LatLng, LatLngBounds, latLngBounds, Point, ZoomAnimEvent} from "leaflet";

import {Matrix4, PointMapping, Projection} from "../../util";

/**
 * Some extensions to the TS definition of the Leaflet ImageOverlay
 */
declare module "leaflet" {
  interface Map {
    _latLngToNewLayerPoint(latlng: LatLng, zoom: number, center: LatLng): Point;
  }
}

export type CornerNumber = 0 | 1 | 2 | 3;
export type Corners = [LatLng, LatLng, LatLng, LatLng];

/**
 * An extension of the regular Leaflet image overlay that can be transformed with CSS transforms
 */
export class TransformedImageOverlay extends ImageOverlay {

  /**
   * Create a new overlay
   * @param src The image source (can be a data URL)
   * @param corners The coordinates of the four corners
   * @param options Additional options passed to the regular overlay
   */
  constructor(src: string, private corners: Corners, options?: ImageOverlayOptions) {
    super(src, latLngBounds(corners[2], corners[1]), options);
  }

  /**
   * Check if the corners are valid (any corner not [0,0])
   */
  cornersValid(): boolean {
    return this.corners.filter(c => c.lat || c.lng).length > 0;
  }

  /**
   * Get the current coordinates for the four corners
   */
  getCorners(): Corners {
    return this.corners;
  }

  getBounds(): LatLngBounds {
    const lat = this.corners.map(c => c.lat), lng = this.corners.map(c => c.lng);
    return latLngBounds([
      [Math.min.apply(null, lat), Math.min.apply(null, lng)],
      [Math.max.apply(null, lat), Math.max.apply(null, lng)]
    ]);
  }

  /**
   * Update the coordinates for one corner
   * @param corner The number of the corner
   * @param latlng The new coordinates of the corner
   */
  setCorner(corner: CornerNumber, latlng: LatLng) {
    this.corners[corner] = latlng;
    this.updateTransform();
  }

  /**
   * Update the coordinates of all corners
   * @param corners The new corner coordinates
   */
  setCorners(corners: Corners) {
    this.corners = corners;
    this.updateTransform();
  }

  /**
   * Get the center of the (possibly distorted) image
   */
  getCenter(): Point {
    if (!this._map) {
      return super.getCenter();
    }

    const c = this.corners.map(corner => this._map.latLngToLayerPoint(corner)),
      nMid = c[0].add(c[1].subtract(c[0]).divideBy(2)),
      sMid = c[2].add(c[3].subtract(c[2]).divideBy(2));
    return nMid.add(sMid.subtract(nMid).divideBy(2));
  }

  /**
   * Calculate the transformation matrix based on the first corner as origin
   * @param latLngToLayerPoint An optional mapping function from coordinates to pixels to use instead of the default
   */
  private getTransformationMatrix(latLngToLayerPoint?: (latlng: LatLng) => Point): Matrix4 | null {
    const image = this.getElement();
    if (!this._map || !image) {
      return null;
    }

    const latLngToLayerPointFn = latLngToLayerPoint || (latlng => this._map.latLngToLayerPoint(latlng));
    const offset = latLngToLayerPointFn(this.corners[0]),
      w = image.offsetWidth,
      h = image.offsetHeight,
      c = this.corners.map(corner => latLngToLayerPointFn(corner).subtract(offset));

    return Projection.project2D(
      PointMapping.map(0, 0, c[0].x, c[0].y),
      PointMapping.map(w, 0, c[1].x, c[1].y),
      PointMapping.map(0, h, c[3].x, c[3].y),
      PointMapping.map(w, h, c[2].x, c[2].y),
    ).toMatrix3D();
  }

  /**
   * Update the CSS transform settings
   * @param latLngToLayerPoint An optional mapping function from coordinates to pixels to use instead of the default
   */
  private updateTransform(latLngToLayerPoint?: (latlng: LatLng) => Point) {
    const image = this.getElement();
    if (!this._map || !image) {
      return;
    }

    const latLngToLayerPointFn = latLngToLayerPoint || (latlng => this._map.latLngToLayerPoint(latlng));
    const offset = latLngToLayerPointFn(this.corners[0]),
      matrix = this.getTransformationMatrix(latLngToLayerPointFn);

    (<any>image)._leaflet_pos = offset;
    image.style.transform = `translate3d(${offset.x}px,${offset.y}px,0) matrix3d(${matrix})`;
    image.style.transformOrigin = "0 0 0";
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Update the transform instead of the default Leaflet update logic
   */
  protected _reset() {
    this.updateTransform();
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Update the transform instead of the default Leaflet update logic when the map is zoomed
   */
  protected _animateZoom(e: ZoomAnimEvent) {
    this.updateTransform(latlng => this._map._latLngToNewLayerPoint(latlng, e.zoom, e.center));
  }
}

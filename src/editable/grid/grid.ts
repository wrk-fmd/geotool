import {Observable, Subscription} from "rxjs";

import {GeoJSON, latLng, LatLng, Marker} from "leaflet";

import {GridFeatureCollection, isPointFeature} from "../../geojson";
import {EditableFeatureCollection} from "../editable.feature.collection";
import {GridMarker} from "./grid.marker";
import {GridOptions} from "./grid.options";
import {GridRange} from "./grid.range";

/**
 * A feature collection containing an editable grid
 */
export class Grid extends EditableFeatureCollection {

  private base: LatLng;
  private right: LatLng;
  private down: LatLng;

  private readonly gridOptions: GridOptions;
  private readonly horizontal: GridRange;
  private readonly vertical: GridRange;
  private readonly subscriptions: Subscription[] = [];

  private readonly latlngs: (LatLng | null)[][];
  private readonly markers: (GridMarker | null)[][];

  /**
   * Create a new grid from a grid feature collection
   * @param collection The GeoJson feature collection for the grid
   */
  constructor(collection: GridFeatureCollection) {
    super(collection);

    // Add form fields for setting grid parameters
    this.gridOptions = new GridOptions(collection.grid.horizontal, collection.grid.vertical);
    this.propertiesForm.appendInputs([
      {label: "Horizontal start", data: this.gridOptions.horizontalStart},
      {label: "Horizontal end", data: this.gridOptions.horizontalEnd},
      {label: "Vertical start", data: this.gridOptions.verticalStart},
      {label: "Vertical end", data: this.gridOptions.verticalEnd}
    ]);

    // Create ranges for the two grid dimensions
    this.horizontal = new GridRange(this.gridOptions.getHorizontal());
    this.vertical = new GridRange(this.gridOptions.getVertical());

    // Set coordinates for base of grid
    this.base = GeoJSON.coordsToLatLng(<[number, number]>collection.grid.base);
    this.right = GeoJSON.coordsToLatLng(<[number, number]>collection.grid.right);
    this.down = GeoJSON.coordsToLatLng(<[number, number]>collection.grid.down);

    // Load coordinates for existing grid markers
    this.latlngs = [];
    collection.features.forEach(f => {
      if (isPointFeature(f) && f.properties && f.properties.grid) {
        const i = f.properties.grid[0], j = f.properties.grid[1];
        if (!this.latlngs[i]) {
          this.latlngs[i] = [];
        }
        this.latlngs[i][j] = GeoJSON.coordsToLatLng(<[number, number]>f.geometry.coordinates);
      } else {
        this.addData(f);
      }
    });

    // Create all markers for the grid
    this.markers = [];
    this.updateRange(!this.latlngs.length);

    // Subscribe to changes in range
    this.subscribeRange(this.gridOptions.horizontalStart, value => this.horizontal.start = value);
    this.subscribeRange(this.gridOptions.horizontalEnd, value => this.horizontal.end = value);
    this.subscribeRange(this.gridOptions.verticalStart, value => this.vertical.start = value);
    this.subscribeRange(this.gridOptions.verticalEnd, value => this.vertical.end = value);
  }

  /**
   * Add/remove markers according to the range
   * @param addMissing Whether markers should be created, even if missing from {@see latlngs}
   */
  private updateRange(addMissing: boolean) {
    for (let i = 0; i < this.horizontal.size; i++) {
      if (i >= this.markers.length) {
        // Add additional column
        this.markers[i] = [];
      }

      const col = this.markers[i];

      // Loop through existing rows and update them
      for (let j = 0; j < col.length && j < this.vertical.size; j++) {
        if (col[j]) {
          // Update the text of the existing marker
          col[j]!.setText(this.getText(i, j));
        }
      }

      // Create additional rows
      for (let j = col.length; j < this.vertical.size; j++) {
        if (!addMissing && (!this.latlngs[i] || !this.latlngs[i][j])) {
          // Missing markers should not be created, so skip it
          continue;
        }

        // Calculate coordinates for new marker, if not found
        if (!this.latlngs[i]) {
          this.latlngs[i] = [];
        }
        if (!this.latlngs[i][j]) {
          this.latlngs[i][j] = this.getPosition(i, j);
        }

        col[j] = new GridMarker(this.getText(i, j), i, j, this.latlngs[i][j]!, this.isBaseMarker(i, j));
        col[j]!.on("drag", () => this.updatePosition(i, j));
        this.addLayer(col[j]!);
      }

      // Remove rows from this column
      for (let j = this.vertical.size; j < col.length; j++) {
        this.removeMarker(col[j]);
      }

      // Trim column, if necessary
      col.length = this.vertical.size;
    }

    // Remove columns
    for (let i = this.horizontal.size; i < this.markers.length; i++) {
      this.markers[i].forEach(marker => this.removeMarker(marker));
    }

    // Trim rows, if necessary
    this.markers.length = this.horizontal.size;
  }

  private removeMarker(marker: Marker | null) {
    if (marker) {
      this.removeLayer(marker);
    }
  }

  /**
   * Update the position of one marker
   * @param i The horizontal index of the marker
   * @param j The vertical index of the marker
   */
  private updatePosition(i: number, j: number) {
    this.latlngs[i][j] = this.markers[i][j]!.getLatLng();

    if (this.isBaseMarker(i, j)) {
      // Recalculate all marker positions if one of the three base markers was moved
      this.updateMarkers();
    }
  }

  private isBaseMarker(i: number, j: number) {
    return (i === 0 && j === 0) || (i === 0 && j === this.vertical.size - 1) || (j === 0 && i === this.horizontal.size - 1);
  }

  /**
   * Recalculate all markers based on the base position and right/down distances
   */
  private updateMarkers() {
    if (this.markers.length > 0 && this.markers[0].length > 0 && this.markers[0][0]) {
      this.base = (<GridMarker>this.markers[0][0]).getLatLng();
    }

    const rightIndex = this.markers.length - 1;
    if (rightIndex && this.markers[rightIndex][0]) {
      this.right = this.latLngDiff(this.base, (<GridMarker>this.markers[rightIndex][0]).getLatLng(), rightIndex);
    }

    const downIndex = this.markers.length ?  this.markers[0].length - 1 : null;
    if (downIndex && this.markers[0][downIndex]) {
      this.down = this.latLngDiff(this.base, (<GridMarker>this.markers[0][downIndex]).getLatLng(), downIndex);
    }

    for (let i = 0; i < this.markers.length; i++) {
      for (let j = 0; j < this.markers[i].length; j++) {
        const marker = this.markers[i][j];
        if (marker) {
          this.latlngs[i][j] = this.getPosition(i, j);
          marker.setLatLng(this.latlngs[i][j]!);
        }
      }
    }
  }

  /**
   * Get the difference between two positions as a directed latlng vector
   * @param a
   * @param b
   */
  private latLngDiff(a: LatLng, b: LatLng, divisor: number): LatLng {
    return latLng((b.lat - a.lat) / divisor, (b.lng - a.lng) / divisor);
  }

  /**
   * Calculate the position of a marker
   * @param i The horizontal index
   * @param j The vertical index
   * @return The calculated position
   */
  private getPosition(i: number, j: number): LatLng {
    return latLng(
      this.base.lat + i * this.right.lat + j * this.down.lat,
      this.base.lng + i * this.right.lng + j * this.down.lng
    );
  }

  /**
   * Calculate the text of a marker
   * @param i The horizontal index
   * @param j The vertical index
   * @return The calculated text
   */
  private getText(i: number, j: number): string {
    return this.horizontal.toString(i) + this.vertical.toString(j);
  }

  /**
   * Subscribe to changes in the range form
   * @param option The option as an observable
   * @param setValue The callback function to call
   */
  private subscribeRange(option: Observable<string | null>, setValue: (value: string | null) => void) {
    this.subscriptions.push(option.subscribe(value => {
        setValue(value);
        this.updateRange(true);
      })
    );
  }

  remove() {
    // Unsubscribe from all form updates
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.length = 0;
    return super.remove();
  }

  /**
   * Export the JSON config data
   */
  toGeoJSON(): GridFeatureCollection {
    return {
      ...super.toGeoJSON(),
      grid: {
        base: GeoJSON.latLngToCoords(this.base),
        right: GeoJSON.latLngToCoords(this.right),
        down: GeoJSON.latLngToCoords(this.down),
        horizontal: this.gridOptions.getHorizontal(),
        vertical: this.gridOptions.getVertical(),
      }
    };
  }
}

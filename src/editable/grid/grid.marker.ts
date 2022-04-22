import {Feature, Point} from "geojson";
import {divIcon, LatLngExpression, Marker} from "leaflet";

import {Csv, OV2} from "../../export";
import {EditableLayer} from "../editable.layer";

/**
 * This class displays a marker on a grid
 */
export class GridMarker extends Marker implements EditableLayer, Csv.SupportsCsv, OV2.SupportsOV2 {

  /**
   * Create a new grid marker
   * @param text The displayed text (e.g. 'B10')
   * @param i The horizontal index of the marker (starting at 0)
   * @param j The vertical index of the marker (starting at 0)
   * @param latlng The coordinates of the marker
   */
  constructor(private text: string, private readonly i: number, private readonly j: number, latlng: LatLngExpression) {
    super(latlng, {
      title: text,
      riseOnHover: true,
      draggable: true,
      icon: divIcon({
        className: "text-marker",
        iconSize: [32, 16]
      })
    });
  }

  /**
   * Update the text of the marker
   * @param text The new text (e.g. 'B10')
   */
  setText(text: string) {
    this.text = text;
    const el = this.getElement();
    if (el) {
      el.title = text;
    }
  }

  select(selected: boolean) {
    if (this.dragging) {
      if (selected) {
        this.dragging.enable();
      } else {
        this.dragging.disable();
      }
    }
  }

  download() {
  }

  getControls() {
    return [];
  }

  toGeoJSON(): Feature<Point> {
    return {
      ...super.toGeoJSON(),
      properties: {
        text: this.text,
        icon: "text-marker",
        grid: [this.i, this.j],
        generated: true
      }
    }
  }

  toCSV(): Csv.CsvRecord[] {
    return [Csv.getPointRecord(this.getLatLng(), this.text, 'Grid')];
  }

  toOV2(): Blob {
    return OV2.simpleRecord(this.getLatLng(), this.text);
  }
}

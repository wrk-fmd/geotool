import {Feature, Point} from "geojson";
import {divIcon, LatLngExpression, Marker} from "leaflet";

import {Csv, OV2} from "../../export";

/**
 * This class displays a distance marker on a track
 */
export class DistanceMarker extends Marker implements Csv.SupportsCsv, OV2.SupportsOV2 {

  constructor(private readonly distance: number, latlng: LatLngExpression) {
    super(latlng, {
      riseOnHover: true,
      icon: divIcon({
        className: "",
        iconSize: undefined,
        html: `<span class="text-marker" title="km${distance / 1000}"></span>`,
      })
    });
  }

  toGeoJSON(): Feature<Point> {
    return {
      ...super.toGeoJSON(),
      properties: {
        text: this.options.title,
        icon: "text-marker",
        distance: this.distance,
        generated: true
      }
    }
  }

  toCSV(): Csv.CsvRecord[] {
    return [Csv.getPointRecord(this.getLatLng(), this.options.title!, 'Distance')];
  }

  toOV2(): Blob {
    return OV2.simpleRecord(this.getLatLng(), this.options.title!);
  }
}

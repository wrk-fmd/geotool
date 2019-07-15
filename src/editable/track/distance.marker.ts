import {Feature, Point} from "geojson";
import {divIcon, LatLngExpression, Marker} from "leaflet";

/**
 * This class displays a distance marker on a track
 */
export class DistanceMarker extends Marker {

  constructor(private readonly distance: number, latlng: LatLngExpression) {
    super(latlng, {
      title: `km${distance / 1000}`,
      riseOnHover: true,
      icon: divIcon({
        className: "text-marker",
        iconSize: [32, 16]
      })
    });
  }

  toGeoJSON(): Feature<Point> {
    return {
      ...super.toGeoJSON(),
      properties: {
        text: `km${this.distance / 1000}`,
        icon: "text-marker",
        distance: this.distance,
        generated: true
      }
    }
  }

}

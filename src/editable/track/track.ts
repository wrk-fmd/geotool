import {Feature, FeatureCollection, LineString, MultiLineString} from "geojson";

import {Control, featureGroup, FeatureGroup, GeoJSON, LatLng, polyline, Polyline} from "leaflet";
import "leaflet-editable";

import {ToggleButton} from "../../button";
import {isMultiLineString} from "../../geojson";
import {EditableLayer} from "../editable.layer";
import {DistanceMarker} from "./distance.marker";

/**
 * Declare some types for leaflet-editable (the @types package is incompatible with the current Leaflet version)
 */
declare module 'leaflet' {

  interface Polyline {

    enableEdit(): void;

    disableEdit(): void;
  }
}

/**
 * A layer containing an editable track
 */
export class Track extends FeatureGroup implements EditableLayer {

  private resolution: number = 1000;

  private readonly track: Polyline;
  private readonly markers: FeatureGroup;

  private readonly trackControl: ToggleButton;
  private readonly markersControl: ToggleButton;

  /**
   * Create a new track from a LineString feature
   * @param feature The GeoJson feature for this track
   */
  constructor(feature: Feature<LineString | MultiLineString>) {
    super();

    if (!feature.geometry) {
      throw new Error("No track found");
    }

    // Add track
    this.track = polyline(GeoJSON.coordsToLatLngs(feature.geometry.coordinates, isMultiLineString(feature.geometry) ? 1 : 0));
    this.track.on("editable:vertex:dragend editable:vertex:deleted", () => this.calculateMarkers());
    this.addLayer(this.track);

    // Add distances markers
    this.markers = featureGroup();
    this.calculateMarkers();
    this.addLayer(this.markers);


    // Add controls
    this.trackControl = new ToggleButton(
      "fas fa-draw-polygon",
      active => this.setTrackModification(active),
      "Enable track modification [T]", "Disable track modification [T]", "t"
    );
    this.markersControl = new ToggleButton(
      "fas fa-ruler",
      active => this.setMarkers(active),
      "Show kilometer markers [K]", "Hide kilometer markers [K]", "k"
    )
  }

  /**
   * Set the track to editable
   * @param editable
   */
  private setTrackModification(editable: boolean) {
    if (editable) {
      this.track.enableEdit();
    } else {
      this.track.disableEdit();
    }
  }

  /**
   * Set the distance markers to (in)visible
   * @param visible
   */
  private setMarkers(visible: boolean) {
    if (visible) {
      this.addLayer(this.markers);
    } else {
      this.removeLayer(this.markers);
    }
  }

  /**
   * Recalculate the distance markers based on the track
   */
  private calculateMarkers() {
    const latLngs = this.getLatLngs();

    // Remove all previous markers
    this.markers.clearLayers();

    // Start at 0m
    let wantedDistance = 0, previousDistance = 0;

    for (let i = 0; i < latLngs.length; i++) {
      for (let j = 1; j < latLngs[i].length; j++) {
        // Calculate distance from the previous to the next point of the track
        let previousLatLng = latLngs[i][j - 1], nextLatLng = latLngs[i][j],
          nextDistance = previousDistance + previousLatLng.distanceTo(nextLatLng);

        while (wantedDistance <= nextDistance) {
          // Interpolate and add all distance markers between the previous and next point of the track
          this.markers.addLayer(new DistanceMarker(wantedDistance, [
            this.interpolate(wantedDistance, previousDistance, nextDistance, previousLatLng.lat, nextLatLng.lat),
            this.interpolate(wantedDistance, previousDistance, nextDistance, previousLatLng.lng, nextLatLng.lng)
          ]));
          wantedDistance += this.resolution;
        }

        previousDistance = nextDistance;
      }
    }
  }

  /**
   * Get the points of the polyline
   * @return The points, always in the format of a MultiLineString
   */
  private getLatLngs(): LatLng[][] {
    const latLngs = this.track.getLatLngs();
    if (!latLngs) {
      return [];
    }
    return Array.isArray(latLngs[0]) ? <LatLng[][]>latLngs : [<LatLng[]>latLngs];
  }

  /**
   * Interpolate a given distance between two known points
   * @param wantedDist The distance for which the coordinates should be interpolated
   * @param prevDist The distance at the previous point
   * @param nextDist The distance at the next point
   * @param prevCoord The coordinate (lat or lng) of the previous point
   * @param nextCoord The coordinate (lat or lng) of the next point
   * @return The calculated coordinate for the point (lat or lng)
   */
  private interpolate(wantedDist: number, prevDist: number, nextDist: number, prevCoord: number, nextCoord: number) {
    return prevCoord + (nextCoord - prevCoord) * (wantedDist - prevDist) / (nextDist - prevDist);
  }

  /**
   * Get additional buttons for tracks
   */
  getControls(): Control.EasyButton[] {
    return [this.trackControl, this.markersControl];
  }

  /**
   * Called when this feature set is (un)selected
   * @param selected Whether the set has been selected or unselected
   */
  select(selected: boolean) {
    if (selected) {
      this.markersControl.active = true;
    } else {
      this.trackControl.active = false;
      this.markersControl.active = false;
    }
  }

  /**
   * Remove this track completely
   */
  remove() {
    this.track.remove();
    this.markers.remove();
    return super.remove();
  }

  download() {
  }

  /**
   * Export the JSON config data
   */
  toGeoJSON(): FeatureCollection {
    return {
      type: "FeatureCollection",
      features: [
        this.track.toGeoJSON(),
        ...(<FeatureCollection>this.markers.toGeoJSON()).features
      ]
    };
  }
}

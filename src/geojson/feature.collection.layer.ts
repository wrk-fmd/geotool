import {Feature, GeoJsonObject, Point} from "geojson";
import {FeatureGroup, GeoJSON, GeoJSONOptions, LatLng, Layer, Marker, Polyline, Polygon} from "leaflet";

import {
  isFeature,
  isFeatureCollection,
  isGeometry,
  isGeometryCollection,
  isLineString,
  isMultiLineString,
  isMultiPoint,
  isMultiPolygon,
  isPoint,
  isPolygon
} from "./geojson.type.guards";


/**
 * This class extends the default Leaflet GeoJSON implementation to allow overriding how each GeoJSON type is created
 */
export class FeatureCollectionLayer extends GeoJSON {

  constructor(geojson: GeoJsonObject, options?: GeoJSONOptions) {
    super(geojson, Object.assign({style: {}}, options));
  }

  /**
   * Add one ore more GeoJson objects to the layer
   * @param geojson The GeoJson data
   */
  addData(geojson: GeoJsonObject | GeoJsonObject[]) {
    if (Array.isArray(geojson)) {
      geojson.forEach(feature => this.addData(feature));
      return this;
    }

    if (isFeatureCollection(geojson)) {
      geojson.features.forEach(feature => this.addData(feature));
      return this;
    }

    let feature: Feature;
    if (isFeature(geojson)) {
      feature = geojson;
    } else if (isGeometry(geojson)) {
      // Create a dummy feature to wrap the geometry in, if none was given
      feature = {
        type: "Feature",
        geometry: geojson,
        properties: null
      }
    } else {
      return this;
    }

    const options = this.options;
    if (options.filter && !options.filter(feature)) {
      return this;
    }

    const layer = this.geometryToLayer(feature);
    if (!layer) {
      return this;
    }

    (<any>layer).feature = feature;
    (<any>layer).defaultOptions = (<any>layer).options;
    this.resetStyle(layer);

    if (options.onEachFeature) {
      options.onEachFeature(feature, layer);
    }

    return this.addLayer(layer);
  }

  /**
   * Create the layer for a feature instance
   * @param feature The feature containing the geometry object
   * @return A layer or null, if either feature or geometry were empty
   */
  private geometryToLayer(feature: Feature | null): Layer | null {
    if (!feature) {
      return null;
    }

    const geometry = feature.geometry;
    if (!geometry) {
      return null;
    }

    const coordsToLatLng = this.options && this.options.coordsToLatLng || GeoJSON.coordsToLatLng;

    if (isPoint(geometry)) {
      return this.pointToLayer(feature, coordsToLatLng(<[number, number]>geometry.coordinates));
    }

    if (isMultiPoint(geometry)) {
      return this.multiPointToLayer(feature, GeoJSON.coordsToLatLngs(geometry.coordinates, 0, coordsToLatLng));
    }

    if (isLineString(geometry)) {
      return this.lineToLayer(feature, GeoJSON.coordsToLatLngs(geometry.coordinates, 0, coordsToLatLng));
    }

    if (isMultiLineString(geometry)) {
      return this.multiLineToLayer(feature, GeoJSON.coordsToLatLngs(geometry.coordinates, 1, coordsToLatLng));
    }

    if (isPolygon(geometry)) {
      return this.polygonToLayer(feature, GeoJSON.coordsToLatLngs(geometry.coordinates, 1, coordsToLatLng));
    }

    if (isMultiPolygon(geometry)) {
      return this.multiPolygonToLayer(feature, GeoJSON.coordsToLatLngs(geometry.coordinates, 2, coordsToLatLng));
    }

    if (isGeometryCollection(geometry)) {
      const layers = geometry.geometries.map(g => this.geometryToLayer({
        type: "Feature",
        geometry: g,
        properties: feature.properties
      })).filter((l): l is Layer => !!l);
      return new FeatureGroup(layers);
    }

    throw new Error("Invalid GeoJSON object.");
  }

  /**
   * Creates a layer for a Point geometry
   * @param feature The feature containing the point
   * @param latlng The position of the point
   * @return A layer for this point
   */
  protected pointToLayer(feature: Feature | null, latlng: LatLng): Layer {
    const pointToLayer = this.options && this.options.pointToLayer;
    return pointToLayer ? pointToLayer(<Feature<Point>>feature, latlng) : new Marker(latlng);
  }

  /**
   * Creates a layer for a MultiPoint geometry
   * @param feature The feature containing the multipoint
   * @param latlngs The positions of the points
   * @return A layer containing all of the points
   */
  protected multiPointToLayer(feature: Feature | null, latlngs: LatLng[]): Layer {
    return new FeatureGroup(latlngs.map(p => this.pointToLayer(feature, p)));
  }

  /**
   * Creates a layer for a LineString geometry
   * @param feature The feature containing the line
   * @param latlngs The positions along the line
   * @return A layer containing the line
   */
  protected lineToLayer(feature: Feature | null, latlngs: LatLng[]): Layer {
    return new Polyline(latlngs, this.options);
  }

  /**
   * Creates a layer for a MultiLineString geometry
   * @param feature The feature containing the lines
   * @param latlngs An array, where each item represents one line
   * @return A layer containing the line
   */
  protected multiLineToLayer(feature: Feature | null, latlngs: LatLng[][]): Layer {
    return new Polyline(latlngs, this.options);
  }

  /**
   * Creates a layer for a Polygon geometry
   * @param feature The feature containing the polygon
   * @param latlngs An array, where each item contains the corners of one area of the polygon
   * @return A layer containing the polygon
   */
  protected polygonToLayer(feature: Feature | null, latlngs: LatLng[][]): Layer {
    return new Polygon(latlngs, this.options);
  }

  /**
   * Creates a layer for a MultiPolygon geometry
   * @param feature The feature containing the multipolygon
   * @param latlngs An array, where each item represents one polygon
   * @return A layer containing the polygons
   */
  protected multiPolygonToLayer(feature: Feature | null, latlngs: LatLng[][][]): Layer {
    return new Polygon(latlngs, this.options);
  }
}

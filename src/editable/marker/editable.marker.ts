import {combineLatest, Observable, Subscription} from "rxjs";
import {map} from "rxjs/operators";

import {Feature, Point} from "geojson";
import {Control, divIcon, LatLngExpression, Map, Marker, popup} from "leaflet";

import {Csv, OV2} from "../../export";
import {Form} from "../../form";
import {MarkerProperties} from "../../geojson";
import {EditableLayer} from "../editable.layer";
import {MarkerClasses} from "./marker.classes";
import {MarkerOptions} from "./marker.options";

/**
 * This class adds editing features to the basic Leaflet Marker
 */
export class EditableMarker extends Marker implements EditableLayer, Csv.SupportsCsv, OV2.SupportsOV2 {

  private readonly propertiesForm: Form;
  private readonly markerOptions: MarkerOptions;

  private readonly subscriptions: Subscription[] = [];

  private color: string | null = null;
  private icon: string | null = null;
  private hAnchor: string | null = null;
  private vAnchor: string | null = null;

  constructor(feature: Feature<Point>, latlng: LatLngExpression, private readonly markerDefaults: MarkerOptions) {
    super(latlng, {
      draggable: true,
      icon: divIcon({
        className: "",
        iconSize: undefined,
        html: '<span></span>'
      })
    });

    // Read options from feature
    this.markerOptions = new MarkerOptions(feature.properties || {});

    // Create the form for the popup
    this.propertiesForm = new Form([
      {label: "Text", type: "textarea", rows: 3, data: this.markerOptions.text},
      {label: "Color", type: "color", data: this.markerOptions.color},
      {label: "Icon", list: MarkerClasses.instance.list, data: this.markerOptions.icon},
      {label: "Hor anchor", type: "range", min: -0.5, max: 0.5, step: 0.25, data: this.markerOptions.hAnchor},
      {label: "Vert anchor", type: "range", min: -1, max: 0, step: 0.25, data: this.markerOptions.vAnchor}
    ]);
    this.bindPopup(popup({minWidth: 350}).setContent(this.propertiesForm.container));

    // Subscribe to changes in the options
    this.subscribeOption(options => options.color, value => this.color = value);
    this.subscribeOption(options => options.icon, value => this.icon = value);
    this.subscribeOption(options => options.hAnchor, value => this.hAnchor = value);
    this.subscribeOption(options => options.vAnchor, value => this.vAnchor = value);
  }

  onAdd(map: Map): this {
    super.onAdd(map);
    this.updateMarker();
    return this;
  }

  remove(): this {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.length = 0;
    return super.remove();
  }

  getControls(): Control.EasyButton[] {
    return [];
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

  toGeoJSON(): Feature<Point, MarkerProperties> {
    return {
      ...super.toGeoJSON(),
      properties: this.markerOptions.getValues()
    };
  }

  toCSV(): Csv.CsvRecord[] {
    return [Csv.getPointRecord(this.getLatLng(), this.markerOptions.text.value || '', '')];
  }

  toOV2(): Blob {
    return OV2.simpleRecord(this.getLatLng(), this.markerOptions.text.value || '');
  }

  private updateMarker() {
    const el = this.getElement();
    if (el && el.firstChild instanceof HTMLElement) {
      const icon = el.firstChild;

      // Set the color and style of the icon
      icon.style.color = this.color || "";
      icon.className = `fas fa-2x ${this.icon || "fa-map-marker-alt"}`;

      // Set the offset for the icon, which is given relative to bottom center
      const left = this.hAnchor ? parseFloat(this.hAnchor) + 0.5 : 0.5;
      const top = this.vAnchor ? parseFloat(this.vAnchor) + 1 : 1;
      icon.style.transform = `translate(${-100 * left}%, ${-100 * top}%)`;
    }
  }

  private subscribeOption(
    getOption: (options: MarkerOptions) => Observable<string | null>,
    setValue: (value: string | null) => void
  ) {
    this.subscriptions.push(
      combineLatest([getOption(this.markerOptions), getOption(this.markerDefaults)]).pipe(
        map(([currentValue, defaultValue]) => currentValue || defaultValue)
      ).subscribe(value => {
        setValue(value);
        this.updateMarker();
      })
    );
  }
}

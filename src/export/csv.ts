import {FeatureGroup, LatLng} from "leaflet";

export namespace Csv {

  const SEPARATOR = ',';
  const NEWLINE = '\n';
  const QUOTE = '"';

  export function mapGroup(group: FeatureGroup): CsvRecord[] {
    return group.getLayers().flatMap(layer => supportsCsv(layer) ? layer.toCSV() : []);
  }

  export function getPointRecord(latlng: LatLng, text: string, type: string): CsvRecord {
    return {text, type, geometry: `Point (${formatLatLng(latlng)})`};
  }

  export function getLineRecord(latlngs: LatLng[] | LatLng[][], text: string, type: string): CsvRecord {
    return {
      text, type,
      geometry: latlngs.length > 0 && Array.isArray(latlngs[0])
        ? getMultiLineString(<LatLng[][]>latlngs)
        : getLineString(<LatLng[]>latlngs)
    };
  }

  function getLineString(latlngs: LatLng[]): string {
    return `LineString ${formatLatLngs(latlngs)}`;
  }

  function getMultiLineString(latlngs: LatLng[][]): string {
    return `MultiLineString (${latlngs.map(formatLatLngs).join(', ')})`;
  }

  function formatLatLngs(latlngs: LatLng[]): string {
    return `(${latlngs.map(formatLatLng).join(', ')})`;
  }

  function formatLatLng(latlng: LatLng): string {
    return `${latlng.lng} ${latlng.lat}`;
  }

  export function serializeCsv(data: CsvRecord[]): string {
    return getHeader() + data.map(formatRow).join('');
  }

  function getHeader(): string {
    return formatRow({text: 'Text', type: 'Type', geometry: 'WKT'});
  }

  function formatRow(row: CsvRecord): string {
    return formatCol(row.text) + SEPARATOR
      + formatCol(row.type) + SEPARATOR
      + formatCol(row.geometry) + NEWLINE;
  }

  function formatCol(col: string): string {
    // This is a VERY dumb implementation of CSV column escaping, but we probably won't need a full library here
    return QUOTE + col.replace(QUOTE, QUOTE + QUOTE) + QUOTE;
  }

  /**
   * This interface represents a single CSV row
   */
  export interface CsvRecord {
    text: string;
    type: string;
    geometry: string;
  }

  /**
   * This interface marks instances that support creating OV2 records
   */
  export interface SupportsCsv {

    /**
     * Get a list of CSV records representing the entry
     * @return A list of CSV records
     */
    toCSV(): CsvRecord[];

  }

  export function supportsCsv(obj: any): obj is SupportsCsv {
    return "toCSV" in obj;
  }
}

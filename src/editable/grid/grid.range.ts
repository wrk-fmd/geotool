/**
 * A class containing the range of one of the grid's dimensions
 */
export class GridRange {

  private _start: string | null = null;
  private _end: string | null = null;

  private numeric: boolean = false;
  private offset: number = 0;
  private _size: number = 0;

  /**
   * Initialize the range
   * @param start The first coordinate (e.g. "A" or "1")
   * @param end The last coordinate (e.g. "Z" or "10")
   */
  constructor([start, end]: [string, string]) {
    this._start = start;
    this._end = end;
    this.calculateRange();
  }

  /**
   * Update the first coordinate
   * @param value
   */
  set start(value: string | null) {
    this._start = value;
    this.calculateRange();
  }

  /**
   * Update the last coordinate
   * @param value
   */
  set end(value: string | null) {
    this._end = value;
    this.calculateRange();
  }

  /**
   * Get size of the range
   * @return The size, or 0 if the range is empty/undefined
   */
  get size(): number {
    return Math.max(this._size, 0);
  }

  /**
   * Return the string representation for a given coordinate
   * @param index The 0-based index relative to {@see start}
   * @return The string representation, e.g. "B" or "5"
   */
  toString(index: number): string {
    const value = this.offset + index;
    return this.numeric ? value.toString() : String.fromCharCode(value);
  }

  private calculateRange() {
    if (!this._start || !this._end) {
      this._size = 0;
      return;
    }

    let startNumber = parseInt(this._start), endNumber = parseInt(this._end);
    if (isNaN(startNumber) || isNaN(endNumber)) {
      this.numeric = false;
      this.offset = this._start.charCodeAt(0);
      this._size = this._end.charCodeAt(0) - this.offset + 1;
    } else {
      this.numeric = true;
      this.offset = startNumber;
      this._size = endNumber - startNumber + 1;
    }
  }
}

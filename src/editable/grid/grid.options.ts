import {BehaviorSubject} from "rxjs";

/**
 * A class containing the options for a grid as Observables
 */
export class GridOptions {

  /** The horizontal grid range start */
  readonly horizontalStart: BehaviorSubject<string | null>;

  /** The horizontal grid range end */
  readonly horizontalEnd: BehaviorSubject<string | null>;

  /** The vertical grid range start */
  readonly verticalStart: BehaviorSubject<string | null>;

  /** The vertical grid range end */
  readonly verticalEnd: BehaviorSubject<string | null>;

  constructor(horizontal: [string, string], vertical: [string, string]) {
    this.horizontalStart = new BehaviorSubject(horizontal[0] || null);
    this.horizontalEnd = new BehaviorSubject(horizontal[1] || null);
    this.verticalStart = new BehaviorSubject(vertical[0] || null);
    this.verticalEnd = new BehaviorSubject(vertical[1] || null);
  }

  getHorizontal(): [string, string] {
    return [this.horizontalStart.value || "", this.horizontalEnd.value || ""];
  }

  getVertical(): [string, string] {
    return [this.verticalStart.value || "", this.verticalEnd.value || ""];
  }
}

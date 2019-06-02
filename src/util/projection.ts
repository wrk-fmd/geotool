import {Matrix3} from "./matrix";

export namespace Projection {

  /**
   * Create a base of a vector space based on the given points
   * @param p1 The point used as the first base vector
   * @param p2 The point used as the second base vector
   * @param p3 The point used as the third base vector
   * @param p4 Another point whose coordinates are (c,c,c) in the new base
   * @return A base, given as a 3x3 matrix
   */
  function baseFromPoints(p1: Point, p2: Point, p3: Point, p4: Point): Matrix3 {
    // Base for the 3-dimensional vector space using the first 3 points
    const B = new Matrix3([p1.x, p1.y, 1, p2.x, p2.y, 1, p3.x, p3.y, 1]);

    // Transform the last point to the new basis (using the adjugate matrix, ignoring the scalar factor 1/det(B))
    const v = B.adjugate().multiplyVector([p4.x, p4.y, 1]);

    // Get a new base such that the coordinates of the fourth point are (1, 1, 1)*1/det(B)
    return B.multiplyDiagonal(v);
  }

  /**
   * Create a transformation projecting four points to their new locations
   * @param p1 A mapping of the first point to its new location
   * @param p2 A mapping of the second point to its new location
   * @param p3 A mapping of the third point to its new location
   * @param p4 A mapping of the fourth point to its new location
   * @return A 3x3 matrix representing a (possibly non-affine) transformation
   */
  export function project2D(p1: PointMapping, p2: PointMapping, p3: PointMapping, p4: PointMapping) {
    const from = baseFromPoints(p1.from, p2.from, p3.from, p4.from),
      to = baseFromPoints(p1.to, p2.to, p3.to, p4.to);

    // Transform required point into "to" base, then back to cartesian based on original points
    return to.multiply(from.adjugate()).normalize(2, 2);
  }
}

/**
 * A 2D point, given by its x and y coordinates
 */
export class Point {
  constructor(readonly x: number, readonly y: number) {
  }
}

/**
 * A mapping from one point to another location
 */
export class PointMapping {
  constructor(readonly from: Point, readonly to: Point) {
  }

  /**
   * Create a point mapping for the given coordinates
   * @param fromX The x coordinates of the original location
   * @param fromY The y coordinates of the original location
   * @param toX The x coordinates of the new location
   * @param toY The y coordinates of the new location
   * @return A mapping containing the two locations of the point
   */
  static map(fromX: number, fromY: number, toX: number, toY: number) {
    return new PointMapping(new Point(fromX, fromY), new Point(toX, toY));
  }
}

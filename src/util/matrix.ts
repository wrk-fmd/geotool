type Vector3 = [number, number, number];
type Vector4 = [number, number, number, number];

/**
 * This class contains some operations on a 3x3 matrix, which can be used for 2D non-linear transformations
 * Parts of the implementation are based on {@link https://github.com/toji/gl-matrix}
 * All values are stored in column format.
 */
export class Matrix3 {

  constructor(readonly values: [number, number, number, number, number, number, number, number, number]) {
  }

  /**
   * Calculate the adjugate matrix, which can be used instead of the inverse matrix if a scalar factor is irrelevant
   * @return The 3x3 adjugate matrix
   */
  adjugate(): Matrix3 {
    const a = this.values;

    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    return new Matrix3([
      a11 * a22 - a12 * a21,
      a02 * a21 - a01 * a22,
      a01 * a12 - a02 * a11,

      a12 * a20 - a10 * a22,
      a00 * a22 - a02 * a20,
      a02 * a10 - a00 * a12,

      a10 * a21 - a11 * a20,
      a01 * a20 - a00 * a21,
      a00 * a11 - a01 * a10
    ]);
  }

  /**
   * Multiply two matrices
   * @param B Another 3x3 matrix
   * @return The result of this*B
   */
  multiply(B: Matrix3): Matrix3 {
    const a = this.values, b = B.values;

    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];

    return new Matrix3([
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,

      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,

      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22
    ]);
  }

  /**
   * Multiply this matrix with a vector
   * @param v A column vector of size 3
   * @return The result of this*v
   */
  multiplyVector(v: Vector3): Vector3 {
    const a = this.values;

    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];

    return [
      a00 * v[0] + a10 * v[1] + a20 * v[2],
      a01 * v[0] + a11 * v[1] + a21 * v[2],
      a02 * v[0] + a12 * v[1] + a22 * v[2]
    ];
  }

  /**
   * Multiply this matrix with a scalar
   * @param s A scalar number
   * @return The result of this*s
   */
  multiplyScalar(s: number) {
    const a = this.values;
    return new Matrix3([
      a[0] * s,
      a[1] * s,
      a[2] * s,
      a[3] * s,
      a[4] * s,
      a[5] * s,
      a[6] * s,
      a[7] * s,
      a[8] * s,
    ]);
  }

  /**
   * Normalize this matrix such that the given element is 1
   * @param i The row of the value to be 1
   * @param j The column of the value to be 1
   * @return This matrix divided by the value at i,j
   */
  normalize(i: number, j: number) {
    return this.multiplyScalar(1 / this.values[3 * j + i]);
  }

  /**
   * Multiply with a diagonal matrix
   * This is just a faster implementation of this*diag(v)
   * @param v v The values used for the main diagonal
   * @return The result of this*diag(v)
   */
  multiplyDiagonal(v: Vector3): Matrix3 {
    const a = this.values;
    return new Matrix3([
      v[0] * a[0], v[0] * a[1], v[0] * a[2],
      v[1] * a[3], v[1] * a[4], v[1] * a[5],
      v[2] * a[6], v[2] * a[7], v[2] * a[8]
    ]);
  }

  /**
   * Add a scaling operation before applying this matrix
   * This is just a faster implementation of this*diag(sx, sy, 1)
   * @param sx The scaling factor of the x component
   * @param sy The scaling factor of the y component
   * @return The result of this*diag(sx, sy, 1)
   */
  scaleBefore(sx: number, sy: number): Matrix3 {
    return this.multiplyDiagonal([sx, sy, 1]);
  }

  /**
   * Add a scaling operation after applying this matrix
   * This is just a faster implementation of diag(sx, sy, 1)*this
   * @param sx The scaling factor of the x component
   * @param sy The scaling factor of the y component
   * @return The result of diag(sx, sy, 1)*this
   */
  scaleAfter(sx: number, sy: number): Matrix3 {
    const a = this.values;
    return new Matrix3([
      sx * a[0], sy * a[1], a[2],
      sx * a[3], sy * a[4], a[5],
      sx * a[6], sy * a[7], a[8]
    ]);
  }

  /**
   * Add a translation operation before applying this matrix
   * This is just a faster implementation of this*translation(tx, ty, 0)
   * @param tx The translation of the x component
   * @param ty The translation of the y component
   * @return The result of this*translation(tx, ty, 0)
   */
  translateBefore(tx: number, ty: number): Matrix3 {
    const a = this.values;
    return new Matrix3([
      a[0], a[1], a[2],
      a[3], a[4], a[5],

      tx * a[0] + ty * a[3] + a[6],
      tx * a[1] + ty * a[4] + a[7],
      tx * a[2] + ty * a[5] + a[8]
    ]);
  }

  /**
   * Add a translation operation after applying this matrix
   * This is just a faster implementation of translation(tx, ty, 0)*this
   * @param tx The translation of the x component
   * @param ty The translation of the y component
   * @return The result of translation(tx, ty, 0)*this
   */
  translateAfter(tx: number, ty: number): Matrix3 {
    const a = this.values;
    return new Matrix3([
      a[0] + a[2] * tx, a[1] + a[2] * ty, a[2],
      a[3] + a[5] * tx, a[4] + a[5] * ty, a[5],
      a[6] + a[8] * tx, a[7] + a[8] * ty, a[8]
    ]);
  }

  /**
   * Get a 3D transformation for this matrix by using the identity for the z-axis
   * This is used because the CSS transform matrix3d takes a 4x4 matrix
   */
  toMatrix3D(): Matrix4 {
    const m = this.values;
    return new Matrix4([
      m[0], m[1], 0, m[2],
      m[3], m[4], 0, m[5],
      0, 0, 1, 0,
      m[6], m[7], 0, m[8]
    ]);
  }
}

/**
 * This class contains some operations on a 4x4 matrix, which can be used for 3D non-linear transformations
 * Parts of the implementation are based on {@link https://github.com/toji/gl-matrix}
 * All values are stored in column format.
 */
export class Matrix4 {
  constructor(readonly values: [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number
    ]) {
  }

  /**
   * Create a diagonal matrix
   * @param v The values used for the main diagonal
   * @return A diagonal 4x4 matrix
   */
  static diagonal(v: Vector4): Matrix4 {
    return new Matrix4([
      v[0], 0, 0, 0,
      0, v[1], 0, 0,
      0, 0, v[2], 0,
      0, 0, 0, v[3]
    ])
  }

  /**
   * Multiply two matrices
   * @param B Another 4x4 matrix
   * @return The result of this*B
   */
  multiply(B: Matrix4): Matrix4 {
    const a = this.values, b = B.values;

    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    return new Matrix4([
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,

      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,

      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,

      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ])
  }

  /**
   * Add a translation operation to this matrix
   * @param tx The translation of the x component
   * @param ty The translation of the y component
   * @param tz The translation of the z component
   * @return A matrix with an additional translation operation
   */
  addTranslation(tx: number, ty: number, tz: number): Matrix4 {
    const m = this.values;
    return new Matrix4([
      m[0], m[1], m[2], m[3],
      m[4], m[5], m[6], m[7],
      m[8], m[9], m[10], m[11],
      tx + m[12], ty + m[13], tz + m[14], m[15]
    ]);
  }

  toString(): string {
    return this.values.join(",");
  }
}

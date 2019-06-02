import {Matrix3} from "../matrix";
import {Canvas, ImageSource} from "./canvas";

/**
 * The simple implementation for transforming and exporting images
 * This only works for affine transformations, i.e. does not support freely distorted images.
 * It was already implemented and might come in handy at some point, though.
 */
export class Canvas2D extends Canvas {

  private readonly ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    super(width, height);

    const gl = this.getCanvas().getContext("2d");
    if (!gl) {
      throw new Error("Could not load 2D rendering context");
    }
    this.ctx = gl;
  }

  protected doDrawImage(image: ImageSource, customTransform: Matrix3 | null | undefined,
    srcX: number, srcY: number, srcWidth: number, srcHeight: number,
    dstX: number, dstY: number, dstWidth: number, dstHeight: number) {

    if (customTransform) {
      // Translate and scale to unit square, apply transformation, then scale and translate back again,
      // because the 2D canvas applies transformations on the absolute pixel positions
      const m = customTransform
        .scaleBefore(1 / dstWidth, 1 / dstHeight).translateBefore(-dstX, -dstY)
        .scaleAfter(dstWidth, dstHeight).translateAfter(dstX, dstY)
        .values;
      this.ctx.setTransform(m[0], m[1], m[3], m[4], m[6], m[7]);
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight);
  }
}

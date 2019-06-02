import {Matrix3} from "../matrix";

export type ImageSource = TexImageSource & CanvasImageSource;

/**
 * This class is a wrapper around a HTML5 canvas used for exporting transformed images
 */
export abstract class Canvas<M = Matrix3> {

  private readonly canvas: HTMLCanvasElement;

  /**
   * Create a new canvas of the given size
   * @param width
   * @param height
   */
  protected constructor(width: number, height: number) {
    // Create the canvas element
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Draw an image on the canvas
   * Default behaviour is to draw the whole source image and use all the available drawing space
   * This can be changed by passing some or all the additional parameters, which have the same meaning as in
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage}
   *
   * @param image The original image
   * @param customTransform An optional transformation matrix to be applied to the image (based on a unit square)
   * @param srcX
   * @param srcY
   * @param srcWidth
   * @param srcHeight
   * @param dstX
   * @param dstY
   * @param dstWidth
   * @param dstHeight
   */
  drawImage(image: ImageSource, customTransform?: M | null,
    srcX?: number, srcY?: number, srcWidth?: number, srcHeight?: number,
    dstX?: number, dstY?: number, dstWidth?: number, dstHeight?: number) {
    this.doDrawImage(image, customTransform,
      srcX || 0, srcY || 0, srcWidth || image.width, srcHeight || image.height,
      dstX || 0, dstY || 0, dstWidth || this.canvas.width, dstHeight || this.canvas.height);
  }

  protected abstract doDrawImage(image: ImageSource, customTransform: M | null | undefined,
    srcX: number, srcY: number, srcWidth: number, srcHeight: number,
    dstX: number, dstY: number, dstWidth: number, dstHeight: number): void;

  /**
   * Get the canvas used in this wrapper
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get the rendered data of the canvas as a Blob
   * {@see HTMLCanvasElement.toBlob}
   *
   * This implementation is apparently not supported by Edge, but who cares.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Browser_compatibility}
   *
   * @param type The target type, defaults to image/png
   * @param quality The quality of the exported file if using image/jpeg or image/webp
   * @return A promise containing the rendered data
   */
  getBlob(type?: string, quality?: any): Promise<Blob> {
    return new Promise((resolve, reject) =>
      this.canvas.toBlob(blob => blob ? resolve(blob) : reject("Could not load canvas content"), type, quality)
    );
  }

  /**
   * Destroy this wrapper and clean up resources
   */
  destroy(): void {
    this.canvas.width = 1;
    this.canvas.height = 1;
    this.canvas.remove();
  }

}

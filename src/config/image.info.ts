/**
 * This class contains the data and metadata of an image
 */
export class ImageInfo {

  /**
   * Create an instance for an image
   * @param img The image element containing the data
   * @param name The original filename associated with the image
   * @param width The original width of the image
   * @param height The original height of the image
   */
  private constructor(private readonly img: HTMLImageElement, readonly name: string,
    readonly width: number, readonly height: number) {
  }

  getSrc(): string {
    return this.img.src;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Make sure this is never included in JSON exports
   */
  toJSON() {
    return undefined;
  }

  /**
   * Load the data and information for an image
   * @param src The URL of the image (can be a data url)
   * @param name The original filename associated with the image
   */
  static async loadImage(src: string, name: string): Promise<ImageInfo> {
    return new Promise<ImageInfo>(resolved => {
      const img = new Image();
      img.onload = () => resolved(new ImageInfo(img, name, img.width, img.height));
      img.src = src;
    });
  }
}

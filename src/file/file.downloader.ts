/**
 * This class provides methods for downloading data
 */
export class FileDownloader {

  private objectURL: string | null = null;

  /**
   * Create a downloader for a file
   * @param name The name of the file, including extension
   */
  constructor(private readonly name: string) {
  }

  /**
   * Set Blob data to download
   * @param data The data as Blob
   */
  setBlob(data: Blob): this {
    this.objectURL = URL.createObjectURL(data);
    return this;
  }

  /**
   * Set string data to download
   * @param data The data as string
   * @param mimeType The MIME type of the data, defaults to application/json
   */
  setString(data: string, mimeType?: string): this {
    return this.setBlob(new Blob([data], {type: mimeType || "application/json"}));
  }

  /**
   * Trigger the download of the file
   */
  download(): this {
    if (this.objectURL) {
      const link = document.createElement("a");
      link.href = this.objectURL;
      link.download = this.name;
      link.click();
    }
    return this;
  }

  /**
   * Destroy the object URL
   */
  destroy() {
    if (this.objectURL) {
      URL.revokeObjectURL(this.objectURL);
      this.objectURL = null;
    }
  }
}

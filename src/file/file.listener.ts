import {FeatureSetConfig, ImageInfo, ImageOverlayConfig} from "../config";

/**
 * This class listens for files dragged into the application and loads them
 */
export class FileListener {

  /**
   * Create and attach a new listener
   * @param element The element the listener should attach itself to
   * @param onLoad The event triggered whenever a file was successfully loaded
   */
  constructor(element: HTMLElement, private readonly onLoad: (config: FeatureSetConfig) => void) {
    element.addEventListener("dragover", e => this.handleDrag(e));
    element.addEventListener("drop", e => this.handleDrop(e));
  }

  private handleDrag(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (e.dataTransfer) {
      // Set the icon of the file drag handle to copy
      e.dataTransfer.dropEffect = "copy";
    }
  }

  /**
   * This method is invoked whenever a file is dropped
   * @param e The DragEvent containing the files
   */
  private async handleDrop(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!e.dataTransfer) {
      return;
    }

    const files = e.dataTransfer.files;
    const configs: Promise<FeatureSetConfig>[] = [], images: Promise<ImageInfo>[] = [];

    // Loop through all dropped files and handle them asynchronously
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      switch (f.type) {
        case "image/png":
        case "image/jpeg":
          // Read an image file
          images.push(this.readUploadedFile(r => r.readAsDataURL(f)).then(ImageInfo.loadImage));
          break;
        case "application/json":
          // Read a JSON config file
          configs.push(this.readUploadedFile(r => r.readAsText(f)).then(JSON.parse));
          break;
        default:
          console.warn(`Unsupported file type ${f.type}`);
      }
    }

    // Wait until all data has been loaded and handle it
    this.handleData(await Promise.all(configs), await Promise.all(images));
  }

  /**
   * Read one single file
   * @param start The method of FileReader used to invoke the reading process
   * @return A Promise containing the file data as a string (encoding depends on the start method)
   */
  private readUploadedFile(start: (reader: FileReader) => void): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject("No result found");
        }
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      start(reader);
    });
  }

  /**
   * Handle the loaded data after it has been successfully loaded
   * The following combinations are currently allowed:
   *  - Exactly one image file, no config files (results in an ImageOverlayConfig)
   *  - Exactly one config file which is not an ImageOverlayConfig, no image file
   *  - Exactly one ImageOverlayConfig and exactly one image file
   * All other combinations are invalid and trigger an error message displayed to the user.
   * @param configs A list of loaded config data
   * @param images A list of loaded image data
   */
  private handleData(configs: FeatureSetConfig[], images: ImageInfo[]) {
    if (images.length > 1) {
      window.alert("Only one image can be added at a time.");
      return;
    }
    if (configs.length > 1) {
      window.alert("Only one config can be added at a time.");
      return;
    }

    let config = configs.length ? configs[0] : null;

    if (images.length) {
      if (!config) {
        // One image added, but config should be created (new overlay)
        config = <ImageOverlayConfig>{
          name: "New image overlay",
          type: "image",
          imageInfo: images[0]
        };
      } else if (config.type === "image") {
        // Combine the existing config with the image file (resume work on an existing overlay)
        (<ImageOverlayConfig>config).imageInfo = images[0];
      } else {
        // Config type not valid for adding images
        window.alert("Config JSON does not match type image.");
        return;
      }
    }

    if (!config || !config.name || !config.type) {
      window.alert("No valid configuration found.");
      return;
    }

    this.onLoad(config);
  }
}

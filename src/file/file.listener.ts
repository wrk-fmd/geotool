import {Feature, FeatureCollection} from "geojson";

import {ImageInfo, ImageOverlayFeature, isImageOverlayFeature} from "../config";
import {NamedFeatureCollection} from "../geojson";

/**
 * This class listens for files dragged into the application and loads them
 */
export class FileListener {

  /**
   * Create and attach a new listener
   * @param element The element the listener should attach itself to
   * @param onLoad The event triggered whenever a file was successfully loaded
   */
  constructor(element: HTMLElement, private readonly onLoad: (config: NamedFeatureCollection) => void) {
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
    const configs: Promise<NamedFeatureCollection>[] = [], images: Promise<ImageInfo>[] = [];

    // Loop through all dropped files and handle them asynchronously
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      switch (f.type) {
        case "image/png":
        case "image/jpeg":
          // Read an image file
          images.push(this.readUploadedFile(r => r.readAsDataURL(f)).then(src => ImageInfo.loadImage(src, f.name)));
          break;
        case "application/json":
        case "application/geo+json":
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
  private handleData(configs: NamedFeatureCollection[], images: ImageInfo[]) {
    configs = configs.filter(c => c.type === "FeatureCollection" && c.features);

    let config: NamedFeatureCollection;
    if (configs.length > 1) {
      config = {
        type: "FeatureCollection",
        features: configs.reduce<Feature[]>((arr, c) => arr.concat(c.features), []),
        name: "New combined feature collection"
      }
    } else if (configs.length) {
      config = configs[0];
      if (!config.name) {
        config.name = "Imported feature collection";
      }
    } else if (images.length) {
      config = {
        type: "FeatureCollection",
        features: [],
        name: "New image overlay"
      }
    } else {
      window.alert("No data found to add");
      return;
    }

    const imagePolygons: { [originalFile: string]: ImageOverlayFeature } = {};
    config.features.forEach(f => {
      if (isImageOverlayFeature(f)) {
        imagePolygons[f.properties.originalFile] = f;
      }
    });

    if (images.length) {
      images.forEach(image => {
        if (imagePolygons[image.name]) {
          imagePolygons[image.name].imageInfo = image;
          delete imagePolygons[image.name];
        } else {
          config.features.push(this.createImageOverlayFeature(image));
        }
      })
    }

    const missingImages = Object.keys(imagePolygons);
    if (missingImages.length) {
      window.alert(`Some image files were missing: ${missingImages.join(", ")}`);
    }

    this.onLoad(config);
  }

  private createImageOverlayFeature(image: ImageInfo): ImageOverlayFeature {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]]
      },
      properties: {
        originalFile: image.name
      },
      imageInfo: image
    }
  }
}

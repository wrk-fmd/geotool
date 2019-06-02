# GeoTool

The GeoTool is a simple browser application for creating and modifying feature sets of geodata
like image overlays or POI sets.

## Requirements

* For building:
  * Node (tested with version 10.16.0)
  * npm (tested with version 6.9.0)
* For running: A current web browser
  * Tested with Chromium 74.
  * Current versions of Firefox and Google Chrome should be fine.
  * Microsoft Edge is untested, and at least the image export is expected to not work.

## Build the project

Run `npm run build` to build the project. This will create all required files in the directory `dist`.

Alternatively, you can run `npm run build:dev` to get an uncompressed build, or `npm run watch` to
watch for files changes and rebuild automatically.

## Run the application

Just open [dist/index.html](dist/index.html) in a web browser. You can serve it through a server, but
running it from the local filesystem is enough.

## Usage

Usage instructions can be found in the [manual](docs/MANUAL.md).

## License

This application and its source code are published under the [MIT license](LICENSE).

The core of the application is based on [Leaflet](https://github.com/Leaflet/Leaflet).

Both the application and documentation use [Font Awesome](https://github.com/FortAwesome/Font-Awesome),
available under the MIT license.

Some code is based on [glMatrix](https://github.com/toji/gl-matrix), available under the MIT license.

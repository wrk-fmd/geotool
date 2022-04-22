# GeoTool

The GeoTool is a simple browser application for creating and modifying feature sets of geodata
like image overlays or POI sets.

## Requirements

* For building:
  * Node (tested with version 16.14.2)
  * npm (tested with version 8.5.0)
* For running: A current web browser
  * Tested with Chrome 100.
  * Current versions of Firefox and Google Chrome should be fine.
  * Microsoft Edge is untested, and at least the image export is expected to not work.

## Run the application

### Using released versions

* Download the latest version from the *Releases* section as zip or tar.gz archive
* Unpack the archive
* Serve the unpacked directory through a webserver or open `index.html` in a browser directly.
  Note: Due to browser limitations, some features might not work if not served through a webserver.

### Using Docker

The latest state of the repository is automatically built as Docker image on every commit.
If you have Docker and Docker Compose installed you can run it as follows:

* Download `docker-compose.yml` to some directory
* Run `docker-compose pull && docker-compose up` from that directory
* Go to [localhost:8080](http://localhost:8080)

### Using locally built version

First install the required dependencies using `npm install`.
Run `npm run build` to build the project. This will create all required files in the directory `dist`.
You can then open [dist/index.html](dist/index.html) in a web browser.

Alternatively, you can run `npm run build:dev` to get an uncompressed build, or `npm run watch` to
watch for files changes and rebuild automatically.

## Usage

Usage instructions can be found in the [manual](docs/MANUAL.md).
A [technical description of the extended GeoJSON format](docs/geojson.md) is also available. 

## License

This application and its source code are published under the [MIT license](LICENSE).

The core of the application is based on [Leaflet](https://github.com/Leaflet/Leaflet).

Both the application and documentation use [Font Awesome](https://github.com/FortAwesome/Font-Awesome),
available under the MIT license.

Parts of the application use [Bootstrap](https://getbootstrap.com), available under the MIT license.

Some code is based on [glMatrix](https://github.com/toji/gl-matrix), available under the MIT license.

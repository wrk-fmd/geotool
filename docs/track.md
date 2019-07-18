# Track feature collection

This feature collection allows editing a track and displaying markers for each kilometer.

## Creating a track collection

A track collection can be created by importing any *GeoJSON* file that contains a *LineString*
or *MultiLineString* feature.
Such files can be exported by many applications like GPS tracking applications.
Other formats can be transformed using services like [geojson.net](https://geojson.net).

Distance markers at each kilometer are automatically calculated.
*Planned feature*: Allow arbitrary intervals (e.g. marker every 500m)

Use the <img src="icons/draw-polygon-solid.svg" height="20"/> button or press `T` to toggle
track modification. Drag a vertex of the track to move it, or click on a vertex to delete it.
Note: Long tracks (with many vertices) might cause GeoTool to react slower in modification mode.

Use the <img src="icons/ruler-solid.svg" height="20"/> button or press `K` to toggle the
visibility of the kilometer markers.

It is possible to add additional markers to the track the same way as in a regular
[POI collection](poi.md).

## Exporting the feature collection

The export generates a single JSON file containing the track as a *LineString* or
*MultiLineString* (depending on the originally imported data). All kilometer markers are
included as *Point* features, with an additional property `generated` set to true.

The generated markers are ignored on reimporting the collection, but will be calculated again.

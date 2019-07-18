# Extended GeoJSON format

The JSON files exported by the GeoTool comply with the GeoJSON format specified in
[RFC 7946](https://tools.ietf.org/html/rfc7946).
Additional information is stored using both the `properties` member of the
[*Feature* object](https://tools.ietf.org/html/rfc7946#section-3.2) and
[*foreign members*](https://tools.ietf.org/html/rfc7946#section-6.1).

As none of the additional properties below are standardized, any application using the exported
files should also be able to handle files where the properties are missing.

## Feature collection

Each feature collection exported by the GeoTool has the foreign member `name`, which gives the
displayed name of a layer as a string.

Additionally, it contains default marker options in the foreign member `markerDefaults`. If the
property is missing it should be interpreted as

```json
{
  "color": "#000000",
  "icon": "fa-map-marker-alt",
  "hAnchor": "0",
  "vAnchor": "0"
}
```

Individual missing properties should default to these values as well.

Note that `hAnchor` defaults to *center* (i.e. will normally be in the range `[-0.5, 0.5]`),
whereas `vAnchor` defaults to *bottom* (i.e. will normally be in the range `[-1, 0]`).
In other words, the anchor is given as offset relative to *bottom center*.
Values might be given as string for implementation reasons.

## POI marker

The `properties` member of a POI marker looks as follows (where any property might miss):

```json
{
  "text": "Title of the POI",
  "color": "#ABCDEF",
  "icon": "fa-map-marker-alt",
  "hAnchor": "0",
  "vAnchor": "0"
}
```

These values override any defaults given in `markerDefaults` (see above). If a value is not set
it should default to the corresponding value in `markerDefaults`.

The notes about the `anchor` values from above apply as well.

Such markers can be present in any exported file, even the more specialized below.

An example of POI markers and options is given in [poi_example.json](examples/poi_example.json).
In this example a default icon and color is set (with the anchor moved to *center/center*),
but some markers use the initial default values explicitly.

## Track

The track itself is exported as a regular *LineString* or *MultiLineString* feature without any
additional properties.

Additionally, the root feature collection contains on *Point* feature for every generated kilometer
marker. The `properties` member for these features looks as follows:

```json
{
  "text": "km15",
  "icon": "text-marker",
  "distance": 15000,
  "generated": true
}
```

Note that the text is displayed in *kilometers*, but the distance value is given in *meters*.

On import, the GeoTool ignores markers with the property `generated` set to `true`.
Applications should import them normally. 

A full example for a 4km long track is given in [track_example.json](examples/track_example.json).

## Grid

A grid adds a foreign member `grid` to the root feature collection.
These parameters are required for reimporting the grid into the GeoTool, but should not be relevant
for using the file in other applications.
It looks as follows:

```json
{
  "base": [16.369798, 48.210135],
  "right":[0.000404, 0],
  "down": [0,-0.000269],
  "horizontal": ["A","J"],
  "vertical": ["1","10"]
}
```

The grid markers themselves are added as *Point* features. The `properties` member for these
features looks as follows:

```json
{
  "text": "A1",
  "icon": "text-marker",
  "grid": [0, 0],
  "generated": true
}
```

The `grid` parameter specifies the horizontal and vertical index of the marker. The index is always
0-based, even if the grid labels don't start at *A* or *1*.

On import, the GeoTool uses the coordinates of these markers according to the grid index, but
regenerates labels given in `text`.
Applications should import them directly. 

A full example for a 3x3 grid is given in [grid_example.json](examples/grid_example.json).

## Image overlay

Image overlays are exported as *Polygon* features with exactly 4 corners.

It has the bounding box set as `bbox`.
This member gives the minimal and maximal longitude/latitude values, which can be used to properly
position the image.
The values are given in the order *west*, *south*, *east*, *north* as required by the
[specification](https://tools.ietf.org/html/rfc7946#section-5).

The `properties` object contains the names of both the original file (which is used for reimporting
into the GeoTool) and the generated file (which should be used for displaying without the need of
calculating transformations again).

A full image overlay feature looks as follows:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [16.358777, 48.205812],
        [16.355118, 48.211757],
        [16.361129, 48.213385],
        [16.36472, 48.207469],
        [16.358777, 48.205812]
      ]
    ],
    "bbox": [16.355118, 48.205812, 16.36472, 48.213385]
  },
  "properties": {
    "originalFile": "layer.png",
    "overlayFile": "layer_generated.png"
  }
}
```

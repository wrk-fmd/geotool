# POI feature collection

This feature collection allows adding and editing arbitrary POIs.
All more specialized feature collections also implement this behaviour in addition to their
specific features.

## Creating a POI collection

A POI collection can be created by clicking on the <img src="icons/plus-solid.svg" height="20"/>
button or using the shortcut `Ins`.

It is also possible to drag any valid *GeoJSON* file onto the map. All *Point* features will be
interpreted as POIs.
Some applications and OpenData services support exporting *GeoJSON* files directly.
Other formats like *KML* can be transformed using services like [geojson.net](https://geojson.net).

## Adding and editing POIs

Activate adding POIs by clicking on the <img src="icons/map-marker-alt-solid.svg" height="20"/>
button or using the shortcut `.`. This button is also available for the specialized collections.

Click anywhere on the map to place a marker.

Click on a marker to edit its properties. The following settings are available:

* *Text*: The title/name of a marker, as it should be displayed in applications. It should not
  include prefixes that are the same for all markers.
* *Color*: Change the color of the marker (defaults to black).
* *Icon*: Set the marker icon as CSS class (see below).
* *Horizontal anchor*: Which horizontal part of the icon specifies the point. In most cases it
  will be centered.
* *Vertical anchor*: Which vertical part of the icon specifies the point. This would be the
  bottom for <img src="icons/map-marker-alt-solid.svg" height="20"/> (default) or the center for
  <img src="icons/plus-solid.svg" height="20"/>.

It is also possible to give default marker settings for the whole feature collection in the
collection settings (<img src="icons/edit-solid.svg" height="20"/> or `N`). Those will be used
if not overridden for individual markers.

### Icons

Icons are specified using a CSS class string.

All [free *Font Awesome* icons](https://fontawesome.com/icons?d=gallery&s=solid&m=free) are
available. They have to be given with `fa-` as prefix, so `fa-map-marker-alt` would result in
<img src="icons/map-marker-alt-solid.svg" height="20"/> (which is also the default).
The color of these icons can be changed with the color property.

Some additional icons are available:

* `marker-height`, `marker-height-22`, `marker-height-27`: Displays a height limit sign, with
  the limit in the sign set to *??m*, *2.2m*, or *2.7m*.
* `marker-danger`: Displays a *danger* sign (red triangle with an exclamation mark inside).
* `marker-redcross`, `marker-graycross`:  Displays a red cross logo, or an alternative in gray.

The color property is ignored for the additional icons. Further icons can be added by editing
[markers.scss](../src/markers.scss). This file also provides helper methods for creating icons.

Note that the anchor (especially vertically) has to be set to center for many icons.

## Exporting the feature collection

The export generates a single JSON file containing all markers as *Point* features. Additional
GeoJSON features that were present in an imported file will also be exported, even if the
GeoTool cannot edit them.

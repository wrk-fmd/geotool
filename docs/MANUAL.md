# Usage manual

## Map navigation

Use the selection tool in the top-right corner to choose the base layer for the map. Currently the
Austrian OpenData map and orthophoto are available as well as an OpenStreetMap layer.

Drag the map to navigate, or use the arrow buttons (as long as the map is focused). Use the zoom
tool in the top-left corner, the `+` and `-` keys, or the mousewheel for zooming.

## Feature types

A *feature collection* is a group of multiple *features* like POIs that can be edited together.
Those terms have the same meaning as in the [GeoJSON](https://en.wikipedia.org/wiki/GeoJSON) standard.

All GeoJSON types can be imported and then exported again.
The following types of features can be created and edited:

* [Arbitrary list of POIs](poi.md)
* [Track with generated periodic markers for distances](track.md) (e.g. per kilometer)
* [Grid markers](grid.md)
* [Image overlay](image.md)

See the description of each type of feature for specific usage.

## Feature collection selector

The list of added feature collection is shown in the bottom-left corner as soon as a feature collection is added.
Click the feature collection to choose another one. You can also switch collections by using the `<` and `>` keys.

## Feature collection controls

The feature collection controls are also shown in the bottom-left corner as soon as a collection is selected.
You can also press the assigned keyboard shortcut.

* <img src="icons/plus-solid.svg" height="20"/>
  Create a new collection of arbitrary POIs.
  Shortcut: <code>Ins</code>

* <img src="icons/th-solid.svg" height="20"/>
  Creat a new grid marker collection.
  Shortcut: <code>G</code>

* <img src="icons/sign-out-alt-solid.svg" height="20"/>
  Unselect the currently selected feature collection.
  Shortcut: <code>Esc</code>

* <img src="icons/edit-solid.svg" height="20"/>
  Edit the currently selected feature collection.
  Shortcut: <code>N</code>

* <img src="icons/trash-alt-solid.svg" height="20"/>
  Delete the currently selected feature collection permanently.
  Shortcut: <code>Del</code>

* <img src="icons/download-solid.svg" height="20"/>
  Export the currently selected feature collection.
  Browsers sometimes block multiple successive downloads, so an exception for this has to be added.
  Shortcut: <code>D</code>

Additional controls are added based on the currently selected feature collection.

## Loading existing feature collection

Existing feature collections can be loaded by dragging a single exported JSON config file onto the map.

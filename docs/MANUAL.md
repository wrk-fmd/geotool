# Usage manual

## Map navigation

Use the selection tool in the top-right corner to choose the base layer for the map. Currently the
Austrian OpenData map and orthophoto are available as well as an OpenStreetMap layer.

Drag the map to navigate, or use the arrow buttons (as long as the map is focused). Use the zoom
tool in the top-left corner, the `+` and `-` keys, or the mousewheel for zooming.

## Feature set types

A *feature set* is a group of multiple *features* like POIs that can be edited together.

The following types of feature sets are available:

* Arbitrary list of POIs *(planned)*
* Track with generated periodic markers for distances (e.g. per kilometer) *(planned)*
* Grid markers *(planned)*
* [Image overlay](image.md)

See the description of each type of feature set for specific usage.

## Feature set selector

The list of added feature sets is shown in the bottom-left corner as soon as a feature set is added.
Click the feature set to choose another set. You can also switch sets by using the `<` and `>` keys.

## Feature set controls

The feature set controls are also shown in the bottom-left corner as soon as a set is selected.
You can also press the assigned keyboard shortcut.

* <img src="icons/sign-out-alt-solid.svg" height="20"/>
  Unselect the currently selected feature set.
  Shortcut: <code>Esc</code>

* <img src="icons/edit-solid.svg" height="20"/>
  Edit the name of the currently selected feature set.
  Shortcut: <code>N</code>

* <img src="icons/trash-alt-solid.svg" height="20"/>
  Delete the currently selected feature set permanently.
  Shortcut: <code>Del</code>

* <img src="icons/download-solid.svg" height="20"/>
  Export the currently selected feature set.
  Browsers sometimes block multiple successive downloads, so an exception for this has to be set.
  Shortcut: <code>D</code>

Additional controls are added based on the currently selected feature set type.

## Loading existing feature sets

Existing feature sets can be loaded by dragging a single exported JSON config file onto the map.

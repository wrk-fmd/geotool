# Grid feature collection

This feature collection allows creating a grid of markers labelled by columns and rows.

## Creating a grid collection

A POI collection can be created by clicking on the <img src="icons/th-solid.svg" height="20"/>
button or using the shortcut `G`.

By default, a 10x10 grid (labelled *A1* to *J10*) is created.

Modify the grid by moving the first three markers (default labels *A1*, *B1*, *A2*). All other
markers will be moved accordingly.

It is also possible to change the positions of individual markers (resulting in an irregular grid).
Note: Moving one of the first three markers causes the other markers to be recalculated,
therefore position them correctly before individual markers.

*Planned feature*: Delete individual markers.

The number of rows and columns and their labels can be edited in the collection settings
(<img src="icons/edit-solid.svg" height="20"/> or `N`).

The horizontal coordinate is given first (i.e., the first coordinate gives the column):

```
A1  B1  C1
A2  B2  C2  ...
A3  B3  C3
    ...
```

This is merely names, though. It is easily possible to change that by just switching the positions
of the *B1* and *A2* markers:

```
A1  A2  A3
B1  B2  B3  ...
C1  C2  C3
    ...
```

As the basis of a grid is mostly given as an [image overlay](image.md) it is helpful to add the
image overlay first, and then create the grid with the overlay still visible in the GeoTool.

## Exporting the feature collection

The export generates a single JSON file containing the grid markers included as *Point* features.
Additionally, the grid settings (label ranges) are included.

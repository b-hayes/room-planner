# Room Planner

## Layout coordinates
- Units are cm. `x,y` is the shape centre, not the top-left corner.
- Positions and sizes snap down to 0.5 cm.
- Shapes are clamped so their rotated bounds never go below `0,0`.
- Rotation is clockwise degrees.

## Rooms and walls
- A room's size is its inside measurement. Walls are 10 cm, drawn outside it.
- Keep the room's inside top-left corner at least 20 cm from `0,0` so frames can straddle the top and left walls.

## Doors and windows
- The bottom edge of the door/window image is the wall side. Rotate by wall: bottom 0, left 90, top 180, right 270.
- Frames are 13 cm deep, centred on the wall (frame centre 5 cm outside the room's inside edge).
- Standard window: 194.5 cm frame, 180 cm glass. Shape 194.5 x 63.
- Standard door: 96.5 cm frame, 82.5 cm door. Shape 96.5 x 95.5, hinge on the left when unrotated.

## Catalog
- `src/catalog.json` lists every toolbar item: name, image, default size and category (`roomObject`, `furniture`, `accessory`).
- Furniture and accessory images put their back on the top edge.

## Grouping
- A shape's `parentId` is the shape it was last dropped onto (empty when dropped on the grid). Rooms never have a parent.
- Room objects (doors, windows, built-ins) only take a room as parent and never hold children.
- Moving a shape carries all its descendants.
- Rotating or resizing a shape moves its descendants with it: they turn around its centre and their offset from it scales.
- Holding Shift while dropping keeps the current parent.

## Heights and stacking
- Each shape has a `height` in cm. `base` is the parent's `top` (0 when the parent is a room); `top` is `base + height`.
- Shapes draw in order of `top`. Room objects always draw at floor level.
- Catalog `parts` split an item into images with their own heights (e.g. a chair's seat, arms and back).

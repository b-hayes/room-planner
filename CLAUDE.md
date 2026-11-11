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

## Furniture
- Furniture images put their back on the top edge.

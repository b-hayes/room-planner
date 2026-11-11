# Room Planner

## Layout coordinates
- Units are cm. `x,y` is the shape centre, not the top-left corner.
- Shapes are clamped so their rotated bounds never go below `0,0`.
- Rotation is clockwise degrees.

## Placing doors and windows
- The bottom edge of the door/window image is the wall side. Rotate by wall: bottom 0, left 90, top 180, right 270.
- Centre a window's glass bar on the room's wall line (half inside, half outside the room).
- Keep the room's top-left corner at least 10 cm from `0,0` so windows can straddle the top and left walls.

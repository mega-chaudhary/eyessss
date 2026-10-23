EYE -> SPACE
============

Your eye, drawn in coloured text characters. Faint rows of text flicker in,
your closed eyelid forms, the eye opens, blinks and looks around, then the
view zooms into the pupil and passes through into space with a pink planet.

HOW TO OPEN
-----------
Double-click index.html. It opens in your web browser (Chrome, Edge, Firefox
or Safari). Nothing to install and no internet needed. With internet, it uses
the JetBrains Mono font. Without it, your normal monospace font is used.

Controls:
  - Click / tap the animation, or the Pause button, to pause and play
  - Drag the timeline to jump to any moment
  - Replay starts again from the build

FILES
-----
index.html     the page
style.css      the look of the page (bars, buttons, colours)
eye.js         the animation itself
photo.js       your eye photo, stored as text so the page also works
               when opened straight from a folder
eye-photo.jpg  the same photo as a normal image, for reference

CHANGING THINGS (all in eye.js)
-------------------------------
Timing          the T = { ... } block near the top, in seconds.
                LOOP is the total length of one loop.
Blinks          BLINKS = [3.15, 4.6] lists when the eye blinks.
                Add more times to blink more often.
Looking around  GAZE lists where the eye looks: [time, left/right, up/down].
Colours         the PAL = [ ... ] block: skin, eye white, iris, planet, stars.
                Each line is a list of [position, [red, green, blue]].
Text size       targetCols in layout(): more columns = smaller characters.
Zoom depth      ZMAX.
Glow            the "soft glow" section near the end of render().
                Change 0.55 to make it stronger or weaker.

USING A DIFFERENT EYE PHOTO
---------------------------
1. Convert the new photo to a base64 "data:image/jpeg;base64,..." string
   (any online "image to base64" tool works) and paste it into photo.js.
2. Update the measurements at the top of eye.js (pupil centre, iris radius,
   eye corners, eyelid curves). They are in pixels of a 966 x 700 photo, so
   resize the new photo to 966 x 700 first.

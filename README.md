# Eye → Space

My eye, drawn in coloured text characters. Faint rows of text flicker in, the closed eyelid forms, the eye opens, blinks and looks around, then the view zooms through the pupil into a starfield with a pink planet.

Plain HTML, CSS and JavaScript. No libraries, no build step.

**▶ Watch it live:** https://mega-chaudhary.github.io/eyessss/

## Run it on your computer

Download the code and double-click `index.html`. It works offline in any modern browser.

- Click the animation, or press **Pause**, to pause and play
- Drag the timeline to jump to any moment
- **Replay** starts again from the beginning

## Files

| File | What it is |
|---|---|
| `index.html` | The page |
| `eye.js` | The animation: eyelid, blinking, iris, zoom, stars, planet |
| `style.css` | The bars and buttons around the animation |
| `photo.js` | The eye photo stored as text, so the page also works when opened straight from a folder |
| `eye-photo.jpg` | The same photo as a normal image |

## How it works

The eye photo is read pixel by pixel. Each character cell on screen samples the photo's brightness and picks a character to match: dense ones like `@#$Q` for bright areas, light ones like `.:/` for dark areas. It's then coloured by what that spot is: skin, white of the eye, or iris. The iris fibres, the eyelid movement, the stars and the planet are calculated with maths each frame.

## Change it

Everything is near the top of `eye.js`:

| Setting | What it does |
|---|---|
| `T = { ... }` | Timing of each part, in seconds |
| `LOOP` | Length of one full loop |
| `BLINKS = [3.15, 4.6]` | When the eye blinks. Add more times to blink more often |
| `GAZE` | Where the eye looks: `[time, left/right, up/down]` |
| `PAL = [ ... ]` | Colours: skin, eye white, iris, planet, stars |
| `ZMAX` | How far the camera zooms in |
| `targetCols` (in `layout()`) | More columns = smaller characters |

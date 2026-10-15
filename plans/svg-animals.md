# Replace drawn animals with SVG images

**Goal:** Swap the code-drawn eagle, orca, and salmon for the three SVG files from
SVG Repo. All game behaviour (flying, bobbing, flipping, hit detection) stays the same.

**Not doing:** changing any game rules, word logic, audio, or UI.

## Steps

### 1. Copy SVGs into the game source folder
Copy all three uploaded SVGs into `games/fishybird/src/`:
- `eagle.svg`
- `orca.svg`
- `salmon.svg`

**Done when:** all three files are present in that folder.

### 2. Wire eagle and orca into main.ts
- Import the two SVGs at the top of `main.ts`
- Add a `preload()` method to `RoundScene` that loads both via `this.load.svg()`
- Replace `createEagle()` with `this.add.image()` using the loaded texture; set display size and depth
- Replace `createOrca()` with `this.add.image()` using the loaded texture; set display size and depth
- Change the two field declarations from `Container` to `Image`
- Delete the two `createEagle()` and `createOrca()` functions
- `npm run ci` must pass

**Done when:** CI is green. The eagle and orca SVGs are bundled in the build output.

### 3. Wire salmon into salmon.ts
The salmon is different: it lives inside a `Container` (for bobbing and positioning),
and many fish can be on screen at once. The plan is to keep the `Container` but put
the SVG image inside it instead of all the drawn shapes.
- Import `salmon.svg` at the top of `salmon.ts`
- In `createSalmon()`, replace every `scene.add.*` shape call with a single
  `scene.add.image(0, 0, "salmon")` sized to match the current body width
- The label text stays (English word on the fish)
- The `halfWidth` / `halfHeight` values on the returned object stay the same so hit
  detection is unchanged
- `npm run ci` must pass

**Done when:** CI is green. Each salmon in a round shows the SVG image instead of drawn shapes.

### 4. Tune display sizes and flip direction
Play a round and check:
- Eagle size and position look right; it flips correctly when diving left vs right
- Orca size looks right jumping out of the water
- Salmon size looks right swimming across the screen; label sits on top of the image

Adjust `setDisplaySize()` values in code until all three look good, then run CI and
commit.

**Done when:** CI is green and all three animals look right in a live round.

## Risks
- Phaser's SVG loader rasterises at load time. If the SVG is loaded at too small a
  size the image will look blurry when displayed larger. The `this.load.svg()` call
  takes a `scale` option to rasterise at a higher resolution -- may need tuning.
- The orca SVG faces left (tail on the right). The eagle and salmon SVGs may face
  different directions. `scaleX = -1` flips any of them -- just need to confirm which
  way each one faces and set the default accordingly.
- The salmon SVG is 512x512 and roughly horizontal; the body bounding box used for
  hit detection may need adjusting once the real image is visible.

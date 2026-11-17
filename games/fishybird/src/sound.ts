import { storageFor } from "@klallam/game-kit";

// Whether FishyBird plays sounds on its own. One setting per device, not per player,
// because it is about the room the device is in, not the person holding it.
const store = storageFor("fishybird");
const KEY = "sound.v1";

export function soundOn(): boolean {
  return store.read(KEY) !== false;
}

export function setSoundOn(on: boolean): void {
  store.write(KEY, on);
}

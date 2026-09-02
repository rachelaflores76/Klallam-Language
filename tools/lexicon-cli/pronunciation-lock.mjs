import {
  hashSounds,
  readPronunciation,
  readPronunciationLock,
  writePronunciationLock,
} from "./lib.mjs";

const sounds = readPronunciation().sounds;
const previous = readPronunciationLock();
const nextHash = hashSounds(sounds);

if (previous && previous.hash === nextHash) {
  console.log("Lock is already current. Nothing changed.");
  process.exit(0);
}

const lock = writePronunciationLock(sounds);

if (previous) {
  console.log(`previous : ${previous.hash}`);
  console.log(`new      : ${lock.hash}`);
} else {
  console.log(`hash     : ${lock.hash}`);
}
console.log(`sounds   : ${lock.soundCount}`);
console.log("\npronunciation.lock updated.");

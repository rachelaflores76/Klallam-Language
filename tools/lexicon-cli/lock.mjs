import { hashEntries, readLexicon, readLock, writeLock } from "./lib.mjs";

const lexicon = readLexicon();
const previous = readLock();
const nextHash = hashEntries(lexicon.entries);

if (previous && previous.hash === nextHash) {
  console.log("Lock is already current. Nothing changed.");
  process.exit(0);
}

const lock = writeLock(lexicon.entries);

if (previous) {
  console.log(`previous : ${previous.hash}`);
  console.log(`new      : ${lock.hash}`);
} else {
  console.log(`hash     : ${lock.hash}`);
}
console.log(`entries  : ${lock.entryCount}`);
console.log("\nlexicon.lock updated.");

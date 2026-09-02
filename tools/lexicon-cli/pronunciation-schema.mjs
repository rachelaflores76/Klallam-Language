/**
 * The shape of pronunciation.xlsx, shared by the export and import commands.
 *
 * Only the Symbols column carries Klallam. Everything else is English or an id, so
 * the sheet can be filled in for a speaker and leave them one column to type into.
 *
 * Columns are matched by header text rather than position, so the sheet can be
 * reordered or sorted in Excel without breaking the import.
 */

export const COLUMNS = [
  { key: "id", label: "id (short name)", match: "id", width: 24, editable: true },
  { key: "symbols", label: "Symbols", width: 16, match: "symbols", editable: true },
  { key: "description", label: "How it sounds", match: "howitsounds", width: 54, editable: true },
  { key: "example_id", label: "example word id", match: "exampleword", width: 20, editable: true },
  {
    key: "example_klallam",
    label: "Klallam (locked, for reference)",
    match: "klallam",
    width: 26,
    editable: false,
  },
];

// A row is only worth reading if these carry something.
const REQUIRED = ["id", "symbols", "description", "example_id"];

// Style 2 is unlocked and editable, style 3 is locked and greyed out.
export const SHEET_COLUMNS = COLUMNS.map((c) => ({
  label: c.label,
  width: c.width,
  style: c.editable ? 2 : 3,
}));

export function soundToRow(sound, exampleKlallam = "") {
  return [sound.id, sound.symbols ?? "", sound.description, sound.example_id, exampleKlallam];
}

function normalize(header) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

function mapColumns(headerRow) {
  const index = {};
  headerRow.forEach((cell, i) => {
    const norm = normalize(cell ?? "");
    for (const column of COLUMNS) {
      if (index[column.key] === undefined && norm.startsWith(column.match)) {
        index[column.key] = i;
      }
    }
  });
  for (const key of REQUIRED) {
    if (index[key] === undefined) {
      const column = COLUMNS.find((c) => c.key === key);
      throw new Error(
        `the sheet has no "${column.label}" column. Row 1 must keep its headers: ` +
          COLUMNS.map((c) => c.label).join(", ")
      );
    }
  }
  return index;
}

/** Where each known column sits in a given sheet, matched by header text. */
export function findColumnIndexes(rows) {
  if (rows.length === 0) throw new Error("The sheet is empty.");
  return mapColumns(rows[0]);
}

/**
 * Turn raw sheet rows into records. Only outer whitespace is stripped, and only
 * because Excel adds it invisibly; interior characters are never touched.
 */
export function rowsToRecords(rows) {
  if (rows.length === 0) throw new Error("The sheet is empty.");
  const index = mapColumns(rows[0]);
  const get = (row, key) => (index[key] === undefined ? "" : (row[index[key]] ?? "").trim());

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const record = {
      row: i + 1,
      id: get(row, "id"),
      symbols: get(row, "symbols"),
      description: get(row, "description"),
      example_id: get(row, "example_id"),
      untrimmedSymbols: index.symbols === undefined ? "" : (row[index.symbols] ?? ""),
    };
    if (!record.id && !record.symbols && !record.description) continue;
    records.push(record);
  }
  return records;
}

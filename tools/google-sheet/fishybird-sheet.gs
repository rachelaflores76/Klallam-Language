/**
 * FishyBird round results -> this Google Sheet.
 *
 * Paste this whole file into Extensions > Apps Script of the sheet that should receive
 * the results, then deploy it as a web app (see README.md next to this file).
 * Each finished FishyBird round arrives as one row on the "Rounds" tab.
 */

var SHEET_NAME = 'Rounds';
var HEADERS = ['Round id', 'Date', 'Player', 'Level', 'Caught', 'Out of', 'Percent', 'Words missed'];
var MAX_ROUNDS_PER_REQUEST = 200;

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var rounds = Array.isArray(data.rounds) ? data.rounds.slice(0, MAX_ROUNDS_PER_REQUEST) : [];
    var sheet = getSheet_();
    var seen = existingIds_(sheet);
    var rows = [];
    for (var i = 0; i < rounds.length; i++) {
      var row = toRow_(rounds[i]);
      if (row === null || seen[row[0]]) continue;
      seen[row[0]] = true;
      rows.push(row);
    }
    if (rows.length > 0) {
      var first = sheet.getLastRow() + 1;
      sheet.getRange(first, 1, rows.length, HEADERS.length).setValues(rows);
      sheet.getRange(first, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd h:mm am/pm');
      sheet.getRange(first, 7, rows.length, 1).setNumberFormat('0%');
    }
    return reply_({ ok: true, added: rows.length });
  } catch (error) {
    return reply_({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

/** Visiting the web app address in a browser shows this, which proves it is deployed. */
function doGet() {
  return reply_({ ok: true, message: 'FishyBird sheet is ready.' });
}

function getSheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (sheet === null) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function existingIds_(sheet) {
  var seen = {};
  var count = sheet.getLastRow() - 1;
  if (count < 1) return seen;
  var ids = sheet.getRange(2, 1, count, 1).getValues();
  for (var i = 0; i < ids.length; i++) seen[String(ids[i][0])] = true;
  return seen;
}

function toRow_(round) {
  if (round === null || typeof round !== 'object') return null;
  var id = text_(round.id, 40);
  var caught = Number(round.caught);
  var outOf = Number(round.outOf);
  var at = new Date(round.at);
  if (id === '' || !isFinite(caught) || !isFinite(outOf) || isNaN(at.getTime())) return null;
  var missed = Array.isArray(round.missed) ? round.missed.slice(0, 50) : [];
  var words = [];
  for (var i = 0; i < missed.length; i++) words.push(text_(missed[i], 80));
  return [
    id,
    at,
    safe_(text_(round.playerName, 30)),
    safe_(text_(round.level, 30)),
    caught,
    outOf,
    outOf > 0 ? caught / outOf : 0,
    safe_(words.join(', ')),
  ];
}

function text_(value, max) {
  return String(value === undefined || value === null ? '' : value).trim().slice(0, max);
}

/** Text starting with = + - or @ would be read as a formula; an apostrophe keeps it text. */
function safe_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}

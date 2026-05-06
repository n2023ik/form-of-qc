const SPREADSHEET_ID = '1SMnemtkeuo-AvWtTJFb34iDjCzA0Ic5X2SxRRS_KGbw';
const SHEET_NAME = 'Responses';

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = parsePayload(e);
    const sheet = getTargetSheet();
    const row = buildRow(sheet, payload);

    sheet.appendRow(row);
    SpreadsheetApp.flush();

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  const rawBody = e.postData.contents;
  try {
    const payload = JSON.parse(rawBody);
    if (!payload || typeof payload !== 'object') {
      throw new Error('Request body must be a JSON object.');
    }

    return payload;
  } catch (error) {
    throw new Error(`Invalid JSON payload: ${rawBody}`);
  }
}

function getTargetSheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_SHEET_ID_HERE') {
    throw new Error('Replace SPREADSHEET_ID in Code.gs with your Google Sheet ID.');
  }

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function buildRow(sheet, payload) {
  const headers = Object.keys(payload);
  const hasHeaders = sheet.getLastRow() > 0 && sheet.getLastColumn() > 0;

  if (!hasHeaders) {
    sheet.appendRow(headers);
    return headers.map((header) => payload[header] ?? '');
  }

  const existingHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((value) => String(value || '').trim());

  return existingHeaders.map((header) => (header && header in payload ? payload[header] : ''));
}
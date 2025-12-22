
import { google } from 'googleapis';
import { ENV } from '../utils/env.js';

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function appendRow(row: any[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: ENV.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:U',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function updateRowByPreviewId(previewId: string, updates: Record<string, any>) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ENV.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:U',
  });

  const rows = res.data.values || [];
  const headers = rows[0];
  const rowIndex = rows.findIndex(r => r[0] === previewId);

  if (rowIndex === -1) throw new Error("Preview row not found");

  // Update specific columns based on header map
  for (const [key, value] of Object.entries(updates)) {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: ENV.GOOGLE_SHEET_ID,
        range: `Sheet1!${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[value]] },
      });
    }
  }
}

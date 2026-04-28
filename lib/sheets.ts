/**
 * lib/sheets.ts
 *
 * Appends a booking row to Google Sheets when payment is confirmed.
 *
 * Run once: npm install googleapis
 */

import { google } from "googleapis";
import type { Booking } from "@/lib/store";

const SPREADSHEET_ID = "1mvI2Y7DwQGZbTyaO7xyKq9TXG8OmKGnq9A5GyBnU2Vc";
const SHEET_NAME = "Sheet1";

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function appendBookingToSheet(booking: Booking): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const paidAt = booking.paidAt
    ? new Date(booking.paidAt).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          booking.bookingId,
          booking.name,
          booking.phone,
          booking.email,
          booking.breakdown,
          booking.total,
          paidAt,
        ],
      ],
    },
  });
}

import { NextResponse } from "next/server";
import { bookings, markBookingPaid } from "@/lib/store";
import { persistPaidArtifacts, paidPdfPath, pathExists } from "@/lib/paid-artifacts";
import { appendBookingToSheet } from "@/lib/sheets";

interface WebhookBody {
  ticketId?: string;
  status?: string;
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: WebhookBody;

  try {
    body = (await request.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  const { ticketId, status } = body;

  if (!ticketId) {
    return NextResponse.json({ message: "Missing ticketId." }, { status: 400 });
  }

  if (status !== "SUCCESS") {
    const booking = bookings.get(ticketId);
    if (booking) {
      bookings.set(ticketId, { ...booking, status: "FAILED" });
    }
    return NextResponse.json({ message: "Payment not successful." }, { status: 200 });
  }

  const booking = markBookingPaid(ticketId);

  if (!booking) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }

  if (!(await pathExists(paidPdfPath(ticketId)))) {
    try {
      await persistPaidArtifacts(booking);
    } catch (err) {
      console.error("[webhook] PDF generation failed:", err);
    }
  }

  try {
    await appendBookingToSheet(booking);
  } catch (err) {
    console.error("[webhook] Google Sheets append failed:", err);
  }

  return NextResponse.json({ message: "OK", bookingId: ticketId });
}
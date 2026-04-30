import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { bookings } from "@/lib/store";
import {
  paidPdfPath,
  pathExists,
  persistPaidArtifacts,
  readPaidTicketPdfFromDisk,
} from "@/lib/paid-artifacts";

type RouteContext = { params: Promise<{ bookingId: string }> };

export const runtime = "nodejs";

function pdfResponse(buffer: Buffer, bookingId: string): NextResponse {
  const safeName = `ticket-${bookingId.replace(/[^\w.-]+/g, "_")}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { bookingId } = await context.params;

  const booking = bookings.get(bookingId);

  if (!booking) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }

  if (booking.status !== "PAID") {
    return NextResponse.json({ message: "Ticket not yet confirmed." }, { status: 402 });
  }

  const pdfPath = paidPdfPath(bookingId);

  if (!(await pathExists(pdfPath))) {
    try {
      await persistPaidArtifacts(booking);
    } catch (err) {
      console.error("[ticket-pdf]", err);
      return NextResponse.json({ message: "Could not generate ticket." }, { status: 500 });
    }
  }

  const buffer = await readFile(pdfPath);
  return pdfResponse(buffer, bookingId);
}
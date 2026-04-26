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
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { bookingId } = await context.params;

  const booking = bookings.get(bookingId);

  if (booking?.status === "PAID") {
    const pdfPath = paidPdfPath(bookingId);

    if (!(await pathExists(pdfPath))) {
      try {
        await persistPaidArtifacts(booking);
      } catch (err) {
        console.error("[ticket-pdf]", err);
        return NextResponse.json(
          { message: "Could not generate ticket file." },
          { status: 500 },
        );
      }
    }

    if (!(await pathExists(pdfPath))) {
      return NextResponse.json({ message: "Ticket PDF missing." }, { status: 404 });
    }

    const buffer = await readFile(pdfPath);
    return pdfResponse(buffer, bookingId);
  }

  const fromDisk = await readPaidTicketPdfFromDisk(bookingId);
  if (fromDisk) {
    return pdfResponse(fromDisk, bookingId);
  }

  return NextResponse.json(
    { message: "Paid ticket not found or not confirmed yet." },
    { status: 404 },
  );
}

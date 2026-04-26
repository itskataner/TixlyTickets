export type BookingStatus = "PENDING" | "PAID" | "FAILED";

export interface TicketLine {
  name: string;
  quantity: number;
  price: number;
}

export interface Booking {
  bookingId: string;
  status: BookingStatus;
  createdAt: number;
  paidAt: number | null;
  name: string;
  phone: string;
  email: string;
  tickets: TicketLine[];
  total: number;
  breakdown: string;
  event: string;
  venue: string;
}

export type CreateBookingInput = Omit<
  Booking,
  "bookingId" | "status" | "createdAt" | "paidAt"
>;

type GlobalWithBookings = typeof globalThis & {
  __kuoBookings?: Map<string, Booking>;
};

const globalStore = globalThis as GlobalWithBookings;

if (!globalStore.__kuoBookings) {
  globalStore.__kuoBookings = new Map<string, Booking>();
}

export const bookings: Map<string, Booking> = globalStore.__kuoBookings;

export function createBooking(payload: CreateBookingInput): Booking {
  const bookingId =
    "TXL-" +
    new Date().toISOString().slice(0, 10).replace(/-/g, "") +
    "-" +
    Math.floor(1000 + Math.random() * 9000);

  const booking: Booking = {
    bookingId,
    status: "PENDING",
    createdAt: Date.now(),
    paidAt: null,
    ...payload,
  };

  bookings.set(bookingId, booking);
  return booking;
}

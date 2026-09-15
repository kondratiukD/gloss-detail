import type { BusyInterval } from "./bookingSlots";
import type { StoredBooking } from "./formStorage";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type BookingInsertResult =
  | { ok: true; id: string }
  | { ok: false; conflict: boolean; message: string };

type BookingRow = {
  start_at: string;
  end_at: string;
};

export async function fetchBusyIntervals(
  fromIso: string,
  toIso: string,
): Promise<BusyInterval[]> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Booking calendar requires Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const { data, error } = await getSupabase()
    .from("bookings")
    .select("start_at, end_at")
    .lt("start_at", toIso)
    .gt("end_at", fromIso);

  if (error) {
    throw new Error(error.message || "Failed to load booked slots.");
  }

  return ((data ?? []) as BookingRow[]).map((row) => ({
    startAt: new Date(row.start_at),
    endAt: new Date(row.end_at),
  }));
}

export async function insertBooking(
  booking: StoredBooking,
): Promise<BookingInsertResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      conflict: false,
      message:
        "Booking calendar requires Supabase. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    };
  }

  if (!booking.startAt || !booking.endAt) {
    return {
      ok: false,
      conflict: false,
      message: "Please select a date and time.",
    };
  }

  const { data, error } = await getSupabase()
    .from("bookings")
    .insert({
      package_id: booking.packageId,
      package_name: booking.packageName,
      package_price: booking.packagePrice,
      first_name: booking.firstName,
      last_name: booking.lastName,
      phone: booking.phone,
      address: booking.address,
      car_make: booking.carMake,
      model_year: booking.modelYear,
      start_at: booking.startAt,
      end_at: booking.endAt,
    })
    .select("id")
    .single();

  if (error) {
    const conflict =
      error.code === "23P01" ||
      /exclusion|overlap|conflicting key/i.test(error.message);
    return {
      ok: false,
      conflict,
      message: conflict
        ? "That time slot was just taken. Please choose another."
        : error.message || "Failed to save booking. Please try again.",
    };
  }

  return { ok: true, id: (data as { id: string }).id };
}

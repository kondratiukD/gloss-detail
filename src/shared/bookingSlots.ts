export const BOOKING_TIME_ZONE = "America/New_York";
export const DAY_START_MINUTES = 9 * 60; // 09:00
export const DAY_END_MINUTES = 19 * 60; // 19:00
export const SLOT_STEP_MINUTES = 45;

/** Package id → service duration in minutes */
export const PACKAGE_DURATION_MINUTES: Record<string, number> = {
  "maintenance detail": 3 * 60,
  "deep clean": 5 * 60,
  exterior: 2 * 60,
  interior: 3 * 60,
};

export type BusyInterval = {
  startAt: Date;
  endAt: Date;
};

export type SlotOption = {
  /** Minutes from midnight in America/New_York */
  minutes: number;
  label: string;
  startAt: Date;
  endAt: Date;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour === "24" ? "0" : map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Convert a wall-clock time in the booking timezone to a UTC Date. */
export function wallTimeInZoneToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string = BOOKING_TIME_ZONE,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const parts = getZonedParts(utcGuess, timeZone);
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actual = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return new Date(utcGuess.getTime() + (desired - actual));
}

export function parseDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

export function formatDateKey(date: Date, timeZone = BOOKING_TIME_ZONE): string {
  const parts = getZonedParts(date, timeZone);
  const mm = String(parts.month).padStart(2, "0");
  const dd = String(parts.day).padStart(2, "0");
  return `${parts.year}-${mm}-${dd}`;
}

export function formatMinutesLabel(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function getPackageDurationMinutes(packageId: string): number {
  const duration = PACKAGE_DURATION_MINUTES[packageId];
  if (!duration) {
    throw new Error(`Unknown package duration for id: ${packageId}`);
  }
  return duration;
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * A start time is unavailable if the new service window overlaps any existing
 * booking's estimated window (e.g. 10:30–15:30 blocks every conflicting start).
 */
export function isStartBlockedByBusy(
  startAt: Date,
  endAt: Date,
  busy: BusyInterval[],
): boolean {
  return busy.some((interval) => {
    const startInsideBusy =
      startAt.getTime() >= interval.startAt.getTime() &&
      startAt.getTime() < interval.endAt.getTime();
    return (
      startInsideBusy ||
      intervalsOverlap(startAt, endAt, interval.startAt, interval.endAt)
    );
  });
}

export function buildCandidateSlots(
  dateKey: string,
  packageId: string,
  busy: BusyInterval[],
  now: Date = new Date(),
): SlotOption[] {
  const duration = getPackageDurationMinutes(packageId);
  const { year, month, day } = parseDateKey(dateKey);
  const todayKey = formatDateKey(now);
  const slots: SlotOption[] = [];

  for (
    let startMinutes = DAY_START_MINUTES;
    startMinutes <= DAY_END_MINUTES;
    startMinutes += SLOT_STEP_MINUTES
  ) {
    const startHour = Math.floor(startMinutes / 60);
    const startMinute = startMinutes % 60;
    const startAt = wallTimeInZoneToUtc(
      year,
      month,
      day,
      startHour,
      startMinute,
    );
    const endAt = new Date(startAt.getTime() + duration * 60_000);

    if (dateKey === todayKey && startAt.getTime() <= now.getTime()) {
      continue;
    }

    if (isStartBlockedByBusy(startAt, endAt, busy)) continue;

    slots.push({
      minutes: startMinutes,
      label: formatMinutesLabel(startMinutes),
      startAt,
      endAt,
    });
  }

  return slots;
}

export function formatSlotRangeLabel(startAt: Date, endAt: Date): string {
  const start = getZonedParts(startAt, BOOKING_TIME_ZONE);
  const end = getZonedParts(endAt, BOOKING_TIME_ZONE);
  const startLabel = formatMinutesLabel(start.hour * 60 + start.minute);
  const endLabel = formatMinutesLabel(end.hour * 60 + end.minute);
  return `${startLabel} – ${endLabel} ET`;
}

export function formatBookingDateLabel(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey);
  const utc = wallTimeInZoneToUtc(year, month, day, 12, 0);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(utc);
}

/** Build calendar grid cells for a month (Sunday-first). */
export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function addMonths(year: number, month: number, delta: number): {
  year: number;
  month: number;
} {
  const index = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function isDateKeyBeforeToday(dateKey: string, now = new Date()): boolean {
  return dateKey < formatDateKey(now);
}

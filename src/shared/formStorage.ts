const BOOKINGS_KEY = "gloss-detail-bookings";
const QUOTES_KEY = "gloss-detail-quotes";

export type StoredBooking = {
  id: string;
  createdAt: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  carMake: string;
  modelYear: string;
};

export type StoredQuote = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  localStorage.setItem(key, JSON.stringify(list));
}

export function saveBooking(
  booking: Omit<StoredBooking, "id" | "createdAt">,
): StoredBooking {
  const entry: StoredBooking = {
    ...booking,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = readList<StoredBooking>(BOOKINGS_KEY);
  list.push(entry);
  writeList(BOOKINGS_KEY, list);
  return entry;
}

export function saveQuote(
  quote: Omit<StoredQuote, "id" | "createdAt">,
): StoredQuote {
  const entry: StoredQuote = {
    ...quote,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = readList<StoredQuote>(QUOTES_KEY);
  list.push(entry);
  writeList(QUOTES_KEY, list);
  return entry;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 10;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidZip(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

export function isValidModelYear(value: string): boolean {
  if (!/^\d{4}$/.test(value.trim())) return false;
  const year = Number(value);
  const maxYear = new Date().getFullYear() + 1;
  return year >= 1980 && year <= maxYear;
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

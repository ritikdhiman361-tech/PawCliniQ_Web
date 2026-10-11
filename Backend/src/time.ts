// Appointment times. All clinics are in India, so a booking's date and time
// are clinic-local (IST, UTC+5:30, no DST) regardless of where the server or
// the browser runs. The database stores the exact instant (timestamptz).

export const TIME_SLOTS = [
  "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

// How far ahead bookings can be made (matches the date picker).
export const BOOKING_WINDOW_DAYS = 14;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, "0");

// "2026-10-10" + "10:30 AM" (IST) → Date
export const toInstant = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [, hh, mm, period] = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(time)!;
  const hours = (Number(hh) % 12) + (period === "PM" ? 12 : 0);
  return new Date(Date.UTC(y, m - 1, d, hours, Number(mm)) - IST_OFFSET_MS);
};

// Date → { date: "2026-10-10", time: "10:30 AM" } in IST
export const fromInstant = (instant: Date) => {
  const ist = new Date(instant.getTime() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  return {
    date: `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`,
    time: `${pad(hours % 12 || 12)}:${pad(ist.getUTCMinutes())} ${hours < 12 ? "AM" : "PM"}`,
  };
};

// JS weekday (0 = Sunday) of a "YYYY-MM-DD" date.
export const weekdayOf = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

// Today's date in IST, plus n days, as "YYYY-MM-DD".
export const istDatePlus = (days: number) =>
  fromInstant(new Date(Date.now() + days * DAY_MS)).date;

// IST day boundaries of a "YYYY-MM-DD" date, for range queries.
export const istDayRange = (date: string) => {
  const start = toInstant(date, "12:00 AM");
  return { gte: start, lt: new Date(start.getTime() + DAY_MS) };
};

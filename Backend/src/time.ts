// Appointment times. All clinics are in India, so a booking's date and time
// are clinic-local (IST, UTC+5:30, no DST) regardless of where the server or
// the browser runs. The database stores the exact instant (timestamptz).

// How far ahead bookings can be made (matches the date picker).
export const BOOKING_WINDOW_DAYS = 14;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_MINUTES = 24 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

// "HH:MM" (24-hour) clock times used for opening hours; "24:00" is midnight
// at the end of the day.
export const CLOCK_TIME = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

const toMinutes = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

// Minutes after midnight → "10:30 AM"
const toSlotLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  return `${pad(hours % 12 || 12)}:${pad(minutes % 60)} ${hours < 12 ? "AM" : "PM"}`;
};

type Hours = { openTime: string; closeTime: string; slotMinutes: number };
type Shift = { startTime: string | null; endTime: string | null };

// The appointment start times a vet offers each working day, in day order.
// The vet's own shift wins over the clinic's hours. An end at or before the
// start runs past midnight, so that day's slots are midnight → end and
// start → midnight.
export const vetSlots = (vet: Shift, clinic: Hours) => {
  const start = toMinutes(vet.startTime ?? clinic.openTime);
  const end = toMinutes(vet.endTime ?? clinic.closeTime);
  const ranges = end > start ? [[start, end]] : [[0, end], [start, DAY_MINUTES]];
  const slots: string[] = [];
  for (const [from, to] of ranges) {
    for (let t = from; t + clinic.slotMinutes <= to; t += clinic.slotMinutes) {
      slots.push(toSlotLabel(t));
    }
  }
  return slots;
};

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

// False for dates that don't exist, like "2026-02-30".
export const isRealDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
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

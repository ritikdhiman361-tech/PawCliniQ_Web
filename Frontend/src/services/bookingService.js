import { api } from "./api";

// "2026-10-10" + "10:30 AM" → Date (local time). Without a time, the end of
// that day.
export const toDateTime = (date, time) => {
  const [y, m, d] = (date || "").split("-").map(Number);
  if (!y) return null;
  let hours = 23;
  let minutes = 59;
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || "");
  if (match) {
    hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
    minutes = Number(match[2]);
  }
  return new Date(y, m - 1, d, hours, minutes);
};

// Local "YYYY-MM-DD" (toISOString would shift the day across timezones).
export const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const formatDate = (dateKey) => {
  const date = toDateTime(dateKey);
  return date
    ? date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : dateKey;
};

// "upcoming" | "completed" | "cancelled" — completed is derived from the
// appointment time having passed, not stored.
export const getBookingPhase = (booking) => {
  if (booking.status === "Cancelled") return "cancelled";
  return new Date(booking.startsAt) < new Date() ? "completed" : "upcoming";
};

export const isBookingForPet = (booking, pet) => booking.petId === pet.id;

export const bookingService = {
  // Admins get every booking (with owner contact details); everyone else
  // only their own. Sorted by appointment time.
  getBookings: () => api("/bookings").then((d) => d.bookings),

  getBookingsForPet: (pet) =>
    api(`/bookings?petId=${encodeURIComponent(pet.id)}`).then((d) => d.bookings),

  // Times already taken for a vet on a date, e.g. ["10:30 AM"].
  getBookedSlots: (vetId, date) =>
    api(
      `/vets/${encodeURIComponent(vetId)}/booked-slots?date=${encodeURIComponent(date)}`,
    ).then((d) => d.slots),

  // The server checks the slot is free (409 if just taken), finds the pet by
  // name among the user's pets or saves it as a new profile.
  createBooking: ({ pet, serviceType, vetId, date, time, notes, visitType, homeAddress }) =>
    api("/bookings", {
      method: "POST",
      body: { pet, serviceType, vetId, date, time, notes, visitType, homeAddress },
    }).then((d) => d.booking),

  cancelBooking: (id) =>
    api(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "PATCH" }).then(
      (d) => d.booking,
    ),

  // Only cancelled or past bookings can be removed from history.
  deleteBooking: (id) =>
    api(`/bookings/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// The in-progress booking (pet → clinic → vet → time), saved on the server
// at each step so going back, refreshing or switching devices keeps it.
// Creating the booking deletes it. Every call resolves to the whole draft:
// { pet, appointment, clinic, vet }, each null until that step is done.
const saveDraft = (method, body) =>
  api("/booking-draft", { method, body }).then((d) => d.draft);

export const bookingDraft = {
  get: () => api("/booking-draft").then((d) => d.draft),
  // Changes only the fields given ({ pet, serviceType, notes, clinicId,
  // vetId }); null clears one. Changing the clinic clears the vet.
  update: (changes) => saveDraft("PATCH", changes),
  clear: () => api("/booking-draft", { method: "DELETE" }),
  // Fresh booking with a saved pet's details pre-filled.
  startForPet: (pet) =>
    saveDraft("PUT", {
      pet: { name: pet.name, species: pet.species, breed: pet.breed },
    }),
};

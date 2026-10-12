import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  bookingService,
  formatDate,
  toDateKey,
  toDateTime,
} from "../services/bookingService";
import BookingSummary from "./BookingSummary";
import FormMessage from "./FormMessage";
import Label from "./Label";
import Spinner from "./Spinner";
import WithBookingDraft from "./WithBookingDraft";
import {
  backLinkClass,
  inputClass,
  primaryBtnClass,
  stepPillClass,
} from "./formStyles";

const DAYS_AHEAD = 14;

// The vet's working days over the next two weeks.
const getAvailableDates = (vetDays) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (vetDays.includes(day.getDay())) dates.push(day);
  }
  return dates;
};

// "09:30 PM" → hour of day (21)
const hourOf = (slot) => {
  const [, hh, period] = /^(\d{2}):\d{2} (AM|PM)$/.exec(slot);
  return (Number(hh) % 12) + (period === "PM" ? 12 : 0);
};

const PERIODS = [
  { name: "Early morning", icon: "🌙", until: 6 },
  { name: "Morning", icon: "🌤️", until: 12 },
  { name: "Afternoon", icon: "☀️", until: 17 },
  { name: "Evening", icon: "🌇", until: 21 },
  { name: "Night", icon: "🌙", until: 24 },
];

// The vet's slots (from the server, in day order) grouped for display;
// empty periods are left out.
const groupSlots = (slots) =>
  PERIODS.map((period, i) => ({
    ...period,
    slots: slots.filter((slot) => {
      const hour = hourOf(slot);
      return hour < period.until && hour >= (PERIODS[i - 1]?.until ?? 0);
    }),
  })).filter((period) => period.slots.length > 0);

const chipClass = (isSelected, isDisabled) =>
  `rounded-2xl border-2 text-sm font-medium transition-colors ${
    isSelected
      ? "bg-linear-to-br from-amber-600 to-amber-800 border-amber-700 text-white shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
      : isDisabled
        ? "bg-stone-50 border-stone-200 text-stone-400 line-through cursor-not-allowed"
        : "bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-500 cursor-pointer"
  }`;

function Schedule({ draft }) {
  const navigate = useNavigate();

  const availableDates = useMemo(
    () => (draft.vet ? getAvailableDates(draft.vet.days) : []),
    [draft.vet],
  );

  const [date, setDate] = useState(() =>
    availableDates[0] ? toDateKey(availableDates[0]) : "",
  );
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState(draft.appointment?.notes || "");
  const isHomeVisit = draft.appointment?.visitType === "home";
  const [homeAddress, setHomeAddress] = useState("");
  // Taken slots, tagged with the date they were loaded for.
  const [booked, setBooked] = useState({ date: null, slots: [] });
  const slotsLoading = booked.date !== date;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const vetId = draft.vet?.id;
  const slotGroups = useMemo(() => groupSlots(draft.vet?.slots ?? []), [draft.vet]);

  useEffect(() => {
    if (!vetId || !date) return;
    let active = true;
    bookingService
      .getBookedSlots(vetId, date)
      .then((slots) => active && setBooked({ date, slots }))
      // Show the day as open; the server still rejects a taken slot.
      .catch(() => active && setBooked({ date, slots: [] }));
    return () => {
      active = false;
    };
  }, [vetId, date]);

  if (confirmed) return <BookingConfirmed booking={confirmed} />;
  if (!draft.pet || !draft.appointment) return <Navigate to="/appointments" replace />;
  if (!draft.clinic) return <Navigate to="/select-clinic" replace />;
  if (!draft.vet) return <Navigate to="/select-vet" replace />;

  const isSlotUnavailable = (slot) =>
    booked.slots.includes(slot) || toDateTime(date, slot) <= new Date();

  const handleConfirm = async () => {
    if (!date) return setError("Please choose a date.");
    if (!time) return setError("Please choose a time slot.");
    if (isHomeVisit && homeAddress.trim().length < 10)
      return setError("Please enter the full address for the home visit.");

    setError("");
    setSubmitting(true);
    try {
      // The server matches the pet to a saved profile by name, or saves it,
      // and deletes the draft.
      const booking = await bookingService.createBooking({
        pet: {
          name: draft.pet.name,
          species: draft.pet.typeLabel,
          breed: draft.pet.breedLabel,
        },
        serviceType: draft.appointment.type,
        vetId: draft.vet.id,
        date,
        time,
        notes: notes.trim(),
        visitType: isHomeVisit ? "home" : "clinic",
        ...(isHomeVisit && { homeAddress: homeAddress.trim() }),
      });
      setConfirmed(booking);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      // The slot may have been taken meanwhile — refresh availability.
      const slots = await bookingService
        .getBookedSlots(draft.vet.id, date)
        .catch(() => booked.slots);
      setBooked({ date, slots });
      setTime("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] px-4 sm:px-8 py-8 md:py-16 font-sans overflow-hidden">
      <div
        className="blob w-72 h-72 -top-10 -left-10 bg-amber-300/25"
        style={{ animation: "blobFloat 16s ease-in-out infinite" }}
      />
      <div
        className="blob w-64 h-64 bottom-0 -right-10 bg-blue-300/20"
        style={{ animation: "blobFloatReverse 18s ease-in-out infinite" }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.button
          type="button"
          onClick={() => navigate("/select-vet")}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          className={backLinkClass}
        >
          ← Back to veterinarians
        </motion.button>

        <BookingSummary draft={draft} />

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="relative w-full bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10"
        >
          <div className={stepPillClass}>🗓️ Pick a Time</div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-2">
            When works for you?
          </h1>
          <p className="text-sm text-amber-700 mb-8">
            Showing {draft.vet.name}'s open slots for the next two weeks
            {draft.vet.hours && ` (${draft.vet.hours})`}.
          </p>

          {/* Dates */}

          <Label icon="📅">Date</Label>
          {availableDates.length === 0 ? (
            <p className="text-sm text-amber-700 mb-6">
              No open days in the next two weeks — please choose another vet.
            </p>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
              {availableDates.map((day) => {
                const key = toDateKey(day);
                const isSelected = key === date;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDate(key);
                      setTime("");
                      setError("");
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={isSelected}
                    className={`${chipClass(isSelected, false)} shrink-0 w-16 py-2.5 flex flex-col items-center`}
                  >
                    <span className="text-[11px] uppercase tracking-wide opacity-80">
                      {day.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span className="text-lg font-semibold leading-tight">
                      {day.getDate()}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {day.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Time slots */}

          {date && (
            <div className={`space-y-4 mb-6 ${slotsLoading ? "opacity-60" : ""}`}>
              {slotGroups.map(({ name, icon, slots }) => (
                <div key={name}>
                  <Label icon={icon}>{name}</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {slots.map((slot) => {
                      const isDisabled = isSlotUnavailable(slot);
                      const isSelected = slot === time;
                      return (
                        <motion.button
                          key={slot}
                          type="button"
                          disabled={isDisabled || slotsLoading}
                          onClick={() => {
                            setTime(slot);
                            setError("");
                          }}
                          whileHover={isDisabled ? {} : { y: -2 }}
                          whileTap={isDisabled ? {} : { scale: 0.95 }}
                          aria-pressed={isSelected}
                          className={`${chipClass(isSelected, isDisabled)} py-2`}
                        >
                          {slot}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Home visit address */}

          {isHomeVisit && (
            <div className="mb-6">
              <Label icon="🏠" htmlFor="home-address">
                Address for the home visit
              </Label>
              <textarea
                id="home-address"
                rows="3"
                maxLength={300}
                className={`${inputClass} resize-none`}
                placeholder="House / flat number, street, area, landmark, city, PIN code"
                value={homeAddress}
                onChange={(e) => {
                  setHomeAddress(e.target.value);
                  setError("");
                }}
              />
            </div>
          )}

          {/* Notes */}

          <Label icon="📋" htmlFor="schedule-notes">
            Notes for the vet
            <span className="normal-case opacity-60 ml-1">(optional)</span>
          </Label>
          <textarea
            id="schedule-notes"
            rows="3"
            maxLength={500}
            className={`${inputClass} resize-none`}
            placeholder="Anything the vet should know before the visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Review */}

          <div className="mt-7 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-2">
              Review
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-amber-900">
              <span>
                🐾 {draft.pet.name} — {draft.pet.breedLabel}
              </span>
              <span>🩺 {draft.appointment.typeLabel}</span>
              <span>🏥 {draft.clinic.name}</span>
              <span>👩‍⚕️ {draft.vet.name}</span>
              <span>
                📅 {date ? formatDate(date) : "Choose a date"}
                {time ? ` · ${time}` : ""}
              </span>
              <span>
                {isHomeVisit
                  ? `🏠 Home visit${homeAddress.trim() ? ` · ${homeAddress.trim()}` : ""}`
                  : `📍 Clinic visit · ${draft.clinic.location}`}
              </span>
            </div>
          </div>

          <FormMessage message={error} className="mt-6" />

          <div className="flex justify-end mt-7">
            <motion.button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              whileHover={
                submitting
                  ? {}
                  : { scale: 1.04, boxShadow: "0 14px 30px rgba(180,83,9,0.4)" }
              }
              whileTap={submitting ? {} : { scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 18 }}
              className={`${primaryBtnClass} w-full sm:w-auto`}
            >
              {submitting && <Spinner />}
              {submitting ? "Confirming…" : "Confirm Booking →"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BookingConfirmed({ booking }) {
  return (
    <div className="relative min-h-[80vh] px-4 sm:px-8 py-8 md:py-16 font-sans overflow-hidden">
      <div
        className="blob w-72 h-72 -top-10 -left-10 bg-amber-300/25"
        style={{ animation: "blobFloat 16s ease-in-out infinite" }}
      />
      <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
          className="relative max-w-xl w-full mx-auto bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.15 }}
            className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl"
          >
            ✓
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-2">
            You're all set!
          </h1>
          <p className="text-sm text-amber-700 mb-6">
            {booking.petName}'s {booking.appointmentType.toLowerCase()} with{" "}
            {booking.vet} is confirmed.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-sm text-amber-900 space-y-1.5 mb-7">
            <p>
              📅 {formatDate(booking.date)} · {booking.time}
            </p>
            <p>🏥 {booking.clinic}</p>
            {booking.visitType === "home" && (
              <p>🏠 Home visit · {booking.homeAddress}</p>
            )}
            <p>👩‍⚕️ {booking.vet}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/bookings" className={`${primaryBtnClass} inline-block`}>
              View My Appointments →
            </Link>
            <Link
              to="/appointments"
              className="inline-block bg-transparent text-amber-700 border-2 border-amber-700 rounded-xl px-6 py-2.5 text-[15px] font-medium hover:bg-amber-50 transition-colors"
            >
              Book another
            </Link>
          </div>
        </motion.div>
    </div>
  );
}

const SchedulePage = () => (
  <WithBookingDraft>{(draft) => <Schedule draft={draft} />}</WithBookingDraft>
);

export default SchedulePage;

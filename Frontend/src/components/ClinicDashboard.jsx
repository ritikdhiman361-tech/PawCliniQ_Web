import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { bookingService, formatDate } from "../services/bookingService";
import FormMessage from "./FormMessage";

// Clinic staff's view of their clinic's appointments. The server only ever
// returns this clinic's bookings for a clinic account.

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const statusClasses = {
  Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Completed: "bg-amber-100 text-amber-800 border-amber-300",
  "No-show": "bg-stone-100 text-stone-700 border-stone-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

// Appointment dates are IST ("YYYY-MM-DD"), whatever the browser's timezone.
const todayIst = () =>
  new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

const tabOf = (b, today) => {
  if (b.status === "Cancelled") return "cancelled";
  if (b.date === today) return "today";
  return b.date > today ? "upcoming" : "past";
};

const mapsUrl = (address) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

const smallBtn =
  "rounded-xl border-2 px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50";

function ClinicDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("today");
  const [vetFilter, setVetFilter] = useState("");
  const [busyId, setBusyId] = useState(null);
  // The booking whose cancel form is open, and the reason typed so far.
  const [cancelling, setCancelling] = useState(null); // { id, reason }

  useEffect(() => {
    let active = true;
    bookingService
      .getBookings()
      .then((list) => active && setBookings(list))
      .catch(() => active && setError("Unable to load appointments. Please refresh."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const today = todayIst();
  const vets = [...new Set(bookings.map((b) => b.vet))].sort();
  const inTab = (key) =>
    bookings.filter(
      (b) => tabOf(b, today) === key && (!vetFilter || b.vet === vetFilter),
    );
  const visible = inTab(tab);
  // Newest first for history; soonest first otherwise.
  if (tab === "past" || tab === "cancelled") visible.reverse();

  const replace = (updated) =>
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

  const run = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      replace(await action());
      setCancelling(null);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-12 font-sans">
      <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-1">
        {user.clinic?.name ?? "Your clinic"}
      </h1>
      <p className="text-sm text-amber-700 mb-6">
        Appointments booked with your clinic. Logged in as {user.name}.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 overflow-x-auto bg-amber-50 border border-amber-200 rounded-full p-1 max-w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setCancelling(null);
              }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${
                tab === t.key ? "bg-white shadow-sm text-amber-900" : "text-amber-700"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">{inTab(t.key).length}</span>
            </button>
          ))}
        </div>

        {vets.length > 1 && (
          <select
            value={vetFilter}
            onChange={(e) => setVetFilter(e.target.value)}
            aria-label="Filter by vet"
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
          >
            <option value="">All vets</option>
            {vets.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
      </div>

      <FormMessage message={error} className="mb-6" />

      {loading ? (
        <p className="text-amber-700 text-sm">Loading appointments…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-14 px-6 bg-amber-50 rounded-2xl border border-dashed border-amber-300 text-amber-700">
          <p className="text-3xl mb-2">🐾</p>
          <p className="font-medium">No appointments here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map((b) => {
            const isConfirmed = b.status === "Confirmed";
            const isFuture = new Date(b.startsAt) > new Date();
            const isBusy = busyId === b.id;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-[0_2px_12px_rgba(120,53,15,0.07)]"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <p className="font-medium text-lg text-amber-900">
                      {b.time} · {b.appointmentType}
                    </p>
                    <p className="text-[13px] text-amber-700">
                      📅 {formatDate(b.date)} · 👩‍⚕️ {b.vet}
                    </p>
                  </div>
                  <span
                    className={`border rounded-full px-3 py-1 text-xs font-medium ${
                      statusClasses[b.status] ?? statusClasses.Confirmed
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-stone-700 mb-4 wrap-break-word">
                  <span>
                    🐾 {b.petName} — {b.petType}
                    {b.breed && `, ${b.breed}`}
                  </span>
                  <span>👤 {b.name}</span>
                  {b.phone && (
                    <a href={`tel:${b.phone}`} className="text-amber-800 underline">
                      📞 {b.phone}
                    </a>
                  )}
                  {b.userEmail && <span>✉️ {b.userEmail}</span>}
                  {b.visitType === "home" ? (
                    <span className="sm:col-span-2">
                      🏠 Home visit · {b.homeAddress}{" "}
                      <a
                        href={mapsUrl(b.homeAddress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-800 underline whitespace-nowrap"
                      >
                        Navigate →
                      </a>
                    </span>
                  ) : (
                    <span>🏥 Clinic visit</span>
                  )}
                  {b.notes && (
                    <span className="sm:col-span-2 text-stone-500">📋 {b.notes}</span>
                  )}
                  {b.cancelReason && (
                    <span className="sm:col-span-2 text-red-700">
                      Reason: {b.cancelReason}
                    </span>
                  )}
                </div>

                {isConfirmed && cancelling?.id === b.id ? (
                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    <input
                      autoFocus
                      value={cancelling.reason}
                      onChange={(e) => setCancelling({ id: b.id, reason: e.target.value })}
                      maxLength={300}
                      placeholder="Reason (shown to the pet owner)"
                      className="flex-1 min-w-48 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setCancelling(null)}
                      className={`${smallBtn} border-transparent text-amber-700`}
                    >
                      Keep it
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        run(b.id, () =>
                          bookingService.cancelBooking(b.id, cancelling.reason.trim()),
                        )
                      }
                      className={`${smallBtn} border-red-300 bg-red-100 text-red-800`}
                    >
                      {isBusy ? "Cancelling…" : "Yes, cancel"}
                    </button>
                  </div>
                ) : (
                  isConfirmed && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {b.date <= today && (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              run(b.id, () => bookingService.setOutcome(b.id, "completed"))
                            }
                            className={`${smallBtn} border-emerald-600 text-emerald-800 hover:bg-emerald-50`}
                          >
                            ✓ Completed
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              run(b.id, () => bookingService.setOutcome(b.id, "no_show"))
                            }
                            className={`${smallBtn} border-stone-400 text-stone-700 hover:bg-stone-50`}
                          >
                            No-show
                          </button>
                        </>
                      )}
                      {isFuture && (
                        <button
                          type="button"
                          onClick={() => setCancelling({ id: b.id, reason: "" })}
                          className={`${smallBtn} border-amber-700 text-amber-700 hover:bg-amber-50`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClinicDashboard;

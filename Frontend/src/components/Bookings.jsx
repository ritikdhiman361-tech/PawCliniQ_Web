import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import {
  bookingService,
  formatDate,
  getBookingPhase,
} from "../services/bookingService";
import { petService } from "../services/petService";
import FormMessage from "./FormMessage";

const statusClasses = {
  Confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Completed: "bg-amber-100 text-amber-800 border-amber-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

const emptyCopy = {
  upcoming: "No upcoming appointments.",
  completed: "No completed visits yet.",
  cancelled: "No cancelled appointments.",
  all: "No bookings yet",
};

// Shown on the card: past confirmed bookings read as "Completed".
const displayStatus = (b) =>
  getBookingPhase(b) === "completed" ? "Completed" : b.status;

function BookingsPage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  // Card currently asking "are you sure?" and the action it's confirming.
  const [confirming, setConfirming] = useState(null); // { id, action }
  const [busyId, setBusyId] = useState(null);
  // Tracks ids currently playing their exit animation, so the card
  // animates out before it actually disappears from the list.
  const [removingIds, setRemovingIds] = useState(() => new Set());

  useEffect(() => {
    let active = true;
    Promise.all([
      bookingService.getBookings(),
      petService.getPets(),
    ])
      .then(([bookingList, petList]) => {
        if (!active) return;
        setBookings(bookingList);
        setPets(petList);
      })
      .catch(() => active && setError("Unable to load your bookings."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const visibleBookings =
    activeTab === "all"
      ? bookings
      : bookings.filter((b) => getBookingPhase(b) === activeTab);

  const countFor = (tab) =>
    tab === "all"
      ? bookings.length
      : bookings.filter((b) => getBookingPhase(b) === tab).length;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const cancelBooking = async (id) => {
    setBusyId(id);
    try {
      const updated = await bookingService.cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch {
      setError("Couldn't cancel this booking. Please try again.");
    } finally {
      setBusyId(null);
      setConfirming(null);
    }
  };

  const deleteBooking = (id) => {
    setConfirming(null);
    setRemovingIds((prev) => new Set(prev).add(id));
    setTimeout(async () => {
      try {
        await bookingService.deleteBooking(id);
        setBookings((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        setError(err.message || "Couldn't remove this booking. Please try again.");
      }
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 220);
  };

  const petNames = pets.map((p) => p.name).join(" & ");

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-12 font-sans">
      {/* Logged-in user status */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 text-sm"
      >
        <div className="flex items-center gap-2 text-amber-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span>
            Logged in as <span className="font-medium">{user.name}</span>
            {petNames && (
              <span className="text-amber-600"> · {petNames}'s parent</span>
            )}
          </span>
        </div>
        <motion.button
          onClick={handleLogout}
          whileHover={{ x: 2 }}
          className="text-amber-700 hover:text-amber-900 underline text-xs font-medium"
        >
          Log out
        </motion.button>
      </motion.div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-1"
          >
            {isAdmin ? "All Bookings" : "My Bookings"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-amber-700 text-sm"
          >
            {loading
              ? "Loading appointments…"
              : `${visibleBookings.length} appointment${
                  visibleBookings.length !== 1 ? "s" : ""
                } found`}
          </motion.p>
        </div>

        <Link
          to="/appointments"
          className="bg-linear-to-br from-amber-600 to-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)] hover:shadow-[0_10px_24px_rgba(180,83,9,0.35)] transition-shadow"
        >
          + New appointment
        </Link>
      </div>

      {/* Status tabs */}
      {!loading && bookings.length > 0 && (
        <div className="flex gap-1 overflow-x-auto bg-amber-50 border border-amber-200 rounded-full p-1 mb-6 w-fit max-w-full">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setConfirming(null);
                }}
                className="relative shrink-0 px-4 py-1.5 rounded-full text-sm font-medium"
              >
                {isActive && (
                  <motion.span
                    layoutId="bookingsTabPill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive ? "text-amber-900" : "text-amber-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-60">
                    {countFor(tab.key)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <FormMessage message={error} className="mb-6" />

      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl border border-amber-100 p-6 animate-pulse"
            >
              <div className="h-5 bg-amber-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-amber-100 rounded w-1/4 mb-5" />
              <div className="h-3 bg-amber-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-amber-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : visibleBookings.length === 0 ? (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-center py-16 sm:py-20 px-6 bg-amber-50 rounded-2xl border border-dashed border-amber-300 text-amber-700"
        >
          <motion.div
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-4xl mb-3 inline-block"
          >
            🐾
          </motion.div>
          <p className="text-base font-medium">
            {bookings.length === 0 ? emptyCopy.all : emptyCopy[activeTab]}
          </p>
          <p className="text-sm opacity-70 mb-5">
            Book your first appointment to see it here.
          </p>
          <Link
            to="/appointments"
            className="inline-block bg-linear-to-br from-amber-600 to-amber-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
          >
            Book an appointment →
          </Link>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4">
          <AnimatePresence initial={false}>
            {visibleBookings.map((b, i) => {
              const status = displayStatus(b);
              const statusClass =
                statusClasses[status] || statusClasses.Confirmed;
              const isRemoving = removingIds.has(b.id);
              const isUpcoming = getBookingPhase(b) === "upcoming";
              const isConfirming = confirming?.id === b.id;
              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={
                    isRemoving
                      ? { opacity: 0, y: 8, scale: 0.97 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{
                    duration: isRemoving ? 0.22 : 0.4,
                    delay: isRemoving ? 0 : i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={
                    isRemoving
                      ? {}
                      : { y: -6, boxShadow: "0 16px 36px rgba(120,53,15,0.18)" }
                  }
                  className="bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-[0_2px_12px_rgba(120,53,15,0.07)]"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                    <div>
                      <p className="font-medium text-lg text-amber-900 m-0">
                        {b.appointmentType}
                        {b.petName && (
                          <span className="font-normal text-amber-700">
                            {" "}
                            for {b.petName}
                          </span>
                        )}
                      </p>
                      <p className="text-[13px] text-amber-700 mt-0.5">
                        📅 {formatDate(b.date)}
                        {b.time && ` · ${b.time}`}
                      </p>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={status}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 16,
                        }}
                        className={`inline-block self-start border rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                      >
                        {status}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-stone-700 mb-4 wrap-break-word">
                    {b.clinic && <span>🏥 {b.clinic}</span>}
                    {b.visitType === "home" && (
                      <span className="sm:col-span-2">🏠 Home visit · {b.homeAddress}</span>
                    )}
                    {b.vet && <span>👩‍⚕️ {b.vet}</span>}
                    <span>
                      🐾 {b.petName} — {b.petType}
                    </span>
                    {b.breed && <span>🦴 {b.breed}</span>}
                    {isAdmin && b.name && <span>👤 {b.name}</span>}
                    {isAdmin && (b.userEmail || b.email) && (
                      <span>✉️ {b.userEmail || b.email}</span>
                    )}
                    {isAdmin && b.phone && <span>📞 {b.phone}</span>}
                    {b.notes && (
                      <span className="sm:col-span-2 text-stone-500">
                        📋 {b.notes}
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {isConfirming ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2.5 items-center justify-end"
                      >
                        <span className="text-[13px] text-amber-800 mr-auto sm:mr-0">
                          {confirming.action === "cancel"
                            ? "Cancel this appointment?"
                            : "Remove it from your history?"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="text-amber-700 hover:text-amber-900 rounded-xl px-3 py-1.5 text-[13px] font-medium"
                        >
                          Keep it
                        </button>
                        <motion.button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() =>
                            confirming.action === "cancel"
                              ? cancelBooking(b.id)
                              : deleteBooking(b.id)
                          }
                          whileTap={{ scale: 0.95 }}
                          className="bg-red-100 text-red-800 border border-red-300 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer disabled:opacity-60"
                        >
                          {busyId === b.id
                            ? "Cancelling…"
                            : confirming.action === "cancel"
                              ? "Yes, cancel"
                              : "Yes, delete"}
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-wrap gap-2.5 justify-end"
                      >
                        {isUpcoming && (
                          <motion.button
                            onClick={() =>
                              setConfirming({ id: b.id, action: "cancel" })
                            }
                            whileHover={{
                              scale: 1.05,
                              backgroundColor: "rgba(180,83,9,0.08)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                              type: "spring",
                              stiffness: 340,
                              damping: 18,
                            }}
                            className="bg-transparent text-amber-700 border-2 border-amber-700 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer"
                          >
                            Cancel
                          </motion.button>
                        )}
                        {/* Only past/cancelled bookings can be removed, so an
                            active appointment is never silently deleted. */}
                        {!isUpcoming && (
                          <motion.button
                            onClick={() =>
                              setConfirming({ id: b.id, action: "delete" })
                            }
                            whileHover={{ scale: 1.05, rotate: -1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                              type: "spring",
                              stiffness: 340,
                              damping: 18,
                            }}
                            className="bg-red-100 text-red-800 border border-red-300 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer"
                          >
                            Delete
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default BookingsPage;

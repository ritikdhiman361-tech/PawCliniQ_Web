import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PET_EMOJI } from "../data/mockData";
import { useAuth } from "../context/useAuth";
import {
  bookingDraft,
  bookingService,
  formatDate,
  getBookingPhase,
} from "../services/bookingService";
import { formatAge, formatWeight, petService } from "../services/petService";
import FormMessage from "./FormMessage";
import PetForm from "./PetForm";
import { backLinkClass, primaryBtnClass } from "./formStyles";

const phaseBadge = {
  upcoming: {
    label: "Confirmed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  completed: {
    label: "Completed",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-300",
  },
};

const StatTile = ({ icon, label, value }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
      {icon} {label}
    </p>
    <p className="text-lg font-semibold text-amber-900">{value}</p>
  </div>
);

function PetProfile() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    petService
      .getPet(petId)
      .then(async (found) => {
        const bookings = found
          ? await bookingService.getBookingsForPet(found)
          : [];
        if (!active) return;
        setPet(found);
        setHistory(bookings);
      })
      .catch(() => active && setError("Unable to load this pet profile."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user, petId]);

  const handleSave = async (values) => {
    const updated = await petService.updatePet(pet.id, values);
    setPet(updated);
    setIsEditing(false);
    setNotice("Profile updated.");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await petService.deletePet(pet.id);
      navigate("/pets", { replace: true });
    } catch {
      setError("Couldn't delete this profile. Please try again.");
      setDeleting(false);
    }
  };

  const handleBook = async () => {
    try {
      await bookingDraft.startForPet(pet);
      navigate("/appointments");
    } catch (err) {
      setError(err.message);
    }
  };

  const upcoming = history.filter((b) => getBookingPhase(b) === "upcoming");
  const past = history.filter((b) => getBookingPhase(b) !== "upcoming").reverse();
  const completedCount = history.filter(
    (b) => getBookingPhase(b) === "completed",
  ).length;

  return (
    <div className="relative min-h-screen bg-amber-50/40 px-4 sm:px-8 py-10 md:py-16 overflow-hidden">
      <div
        className="blob w-72 h-72 -top-20 -left-16 bg-amber-300/20"
        style={{ animation: "blobFloat 16s ease-in-out infinite" }}
      />
      <div
        className="blob w-72 h-72 bottom-0 -right-16 bg-blue-300/20"
        style={{ animation: "blobFloatReverse 18s ease-in-out infinite" }}
      />

      <div className="relative max-w-4xl mx-auto">
        <motion.button
          type="button"
          onClick={() => navigate("/pets")}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          className={backLinkClass}
        >
          ← Back to my pets
        </motion.button>

        <FormMessage message={error} className="mb-6" />

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-amber-100 rounded-3xl p-6 sm:p-10 animate-pulse">
            <div className="flex gap-5 mb-8">
              <div className="w-20 h-20 bg-amber-100 rounded-3xl" />
              <div className="flex-1">
                <div className="h-6 bg-amber-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-amber-100 rounded w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-amber-100 rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {/* Not found */}
        {!loading && !pet && !error && (
          <div className="text-center py-20 bg-white border border-dashed border-amber-300 rounded-3xl">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-xl font-semibold text-amber-900 mb-2">
              Pet not found
            </h2>
            <p className="text-sm text-amber-700 mb-5">
              This profile may have been deleted.
            </p>
            <Link
              to="/pets"
              className="inline-block bg-linear-to-br from-amber-600 to-amber-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
            >
              View my pets
            </Link>
          </div>
        )}

        {!loading && pet && (
          <>
            {/* Profile card */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10 mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
                  className="w-20 h-20 rounded-3xl bg-amber-100 border border-amber-200 flex items-center justify-center text-5xl shrink-0"
                >
                  {PET_EMOJI[pet.species] || PET_EMOJI.Other}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-amber-900 wrap-break-word">
                    {pet.name}
                  </h1>
                  <p className="text-amber-700 mt-1">
                    {pet.species} · {pet.breed}
                  </p>
                </div>
                {!isEditing && (
                  <motion.button
                    type="button"
                    onClick={handleBook}
                    whileHover={{
                      scale: 1.04,
                      boxShadow: "0 14px 30px rgba(180,83,9,0.4)",
                    }}
                    whileTap={{ scale: 0.96 }}
                    className={`${primaryBtnClass} self-start sm:self-center`}
                  >
                    Book Appointment →
                  </motion.button>
                )}
              </div>

              <FormMessage message={notice} tone="success" className="mb-6" />

              <AnimatePresence mode="wait" initial={false}>
                {isEditing ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PetForm
                      initialPet={pet}
                      submitLabel="Save Changes"
                      onSubmit={handleSave}
                      onCancel={() => setIsEditing(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <StatTile icon="🎂" label="Age" value={formatAge(pet.age)} />
                      <StatTile
                        icon="⚖️"
                        label="Weight"
                        value={formatWeight(pet.weight)}
                      />
                      <StatTile icon="⚧" label="Gender" value={pet.gender || "—"} />
                      <StatTile icon="🩺" label="Visits" value={completedCount} />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-7">
                      <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-2">
                        📋 Health notes
                      </p>
                      <p className="text-sm text-amber-900 whitespace-pre-line">
                        {pet.notes ||
                          "No notes yet — add allergies, medications or temperament so vets are prepared."}
                      </p>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      {confirmingDelete ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-wrap gap-2.5 items-center justify-end"
                        >
                          <span className="text-[13px] text-amber-800 mr-auto">
                            Delete {pet.name}'s profile? Past appointments stay
                            in My Appointments.
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(false)}
                            className="text-amber-700 hover:text-amber-900 rounded-xl px-3 py-1.5 text-[13px] font-medium"
                          >
                            Keep it
                          </button>
                          <motion.button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            whileTap={{ scale: 0.95 }}
                            className="bg-red-100 text-red-800 border border-red-300 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer disabled:opacity-60"
                          >
                            {deleting ? "Deleting…" : "Yes, delete"}
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
                          <motion.button
                            type="button"
                            onClick={() => {
                              setIsEditing(true);
                              setNotice("");
                            }}
                            whileHover={{
                              scale: 1.05,
                              backgroundColor: "rgba(180,83,9,0.08)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 340, damping: 18 }}
                            className="bg-transparent text-amber-700 border-2 border-amber-700 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer"
                          >
                            Edit profile
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            whileHover={{ scale: 1.05, rotate: -1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 340, damping: 18 }}
                            className="bg-red-100 text-red-800 border border-red-300 rounded-xl px-4 py-1.5 text-[13px] font-medium cursor-pointer"
                          >
                            Delete
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Appointment history */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-amber-900">
                  Appointments
                </h2>
                {history.length > 0 && (
                  <Link
                    to="/bookings"
                    className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    Manage in My Appointments
                  </Link>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 px-6 bg-amber-50 rounded-2xl border border-dashed border-amber-300 text-amber-700">
                  <p className="text-base font-medium">No appointments yet</p>
                  <p className="text-sm opacity-70">
                    {pet.name}'s visits will show up here once booked.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    ["Upcoming", upcoming],
                    ["History", past],
                  ].map(
                    ([title, list]) =>
                      list.length > 0 && (
                        <div key={title}>
                          <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-2">
                            {title}
                          </p>
                          <div className="grid gap-3">
                            {list.map((b) => {
                              const badge = phaseBadge[getBookingPhase(b)];
                              return (
                                <div
                                  key={b.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-2xl border border-amber-200 px-5 py-4 shadow-[0_2px_12px_rgba(120,53,15,0.05)]"
                                >
                                  <div>
                                    <p className="font-medium text-amber-900">
                                      {b.appointmentType}
                                    </p>
                                    <p className="text-[13px] text-amber-700 mt-0.5">
                                      📅 {formatDate(b.date)}
                                      {b.time && ` · ${b.time}`}
                                      {b.clinic && ` · 🏥 ${b.clinic}`}
                                      {b.vet && ` · ${b.vet}`}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-block self-start sm:self-center border rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

export default PetProfile;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PET_EMOJI } from "../data/mockData";
import { useAuth } from "../context/useAuth";
import {
  bookingDraft,
  bookingService,
  formatDate,
  getBookingPhase,
  isBookingForPet,
} from "../services/bookingService";
import { formatAge, formatWeight, petService } from "../services/petService";
import FormMessage from "./FormMessage";
import PetForm from "./PetForm";
import { stepPillClass } from "./formStyles";

// Bookings are sorted by date, so the first match is the soonest.
const nextAppointmentFor = (pet, bookings) =>
  bookings.find(
    (b) => getBookingPhase(b) === "upcoming" && isBookingForPet(b, pet),
  );

function Pets() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([petService.getPets(), bookingService.getBookings()])
      .then(([petList, bookingList]) => {
        if (!active) return;
        setPets(petList);
        setBookings(bookingList);
      })
      .catch(() => active && setError("Unable to load your pets."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user]);

  const handleAdd = async (values) => {
    const pet = await petService.createPet(values);
    setPets((prev) => [...prev, pet]);
    setIsAdding(false);
    setNotice(`${pet.name}'s profile has been created.`);
  };

  const handleBook = async (pet) => {
    try {
      await bookingDraft.startForPet(pet);
      navigate("/appointments");
    } catch (err) {
      setError(err.message);
    }
  };

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

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className={stepPillClass}>🐾 My Pets</div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-amber-900 mb-2">
              Your furry family
            </h1>
            <p className="text-amber-700 max-w-2xl">
              Keep each pet's details up to date so every vet visit starts with
              the right information.
            </p>
          </motion.div>

          {!isAdding && (
            <motion.button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setNotice("");
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: "0 14px 30px rgba(180,83,9,0.4)",
              }}
              whileTap={{ scale: 0.96 }}
              className="bg-linear-to-br from-amber-600 to-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
            >
              + Add a pet
            </motion.button>
          )}
        </div>

        <FormMessage message={error} className="mb-6" />
        <FormMessage message={notice} tone="success" className="mb-6" />

        {/* Add pet */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -16, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-amber-900 mb-1">
                  Add a new pet
                </h2>
                <p className="text-sm text-amber-700 mb-6">
                  Only the name, type and breed are required.
                </p>
                <PetForm
                  submitLabel="Save Pet →"
                  onSubmit={handleAdd}
                  onCancel={() => setIsAdding(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-amber-100 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-14 h-14 bg-amber-100 rounded-2xl mb-4" />
                <div className="h-5 bg-amber-100 rounded w-1/2 mb-3" />
                <div className="h-3 bg-amber-100 rounded w-3/4 mb-6" />
                <div className="h-10 bg-amber-100 rounded-xl w-32" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && pets.length === 0 && !isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 sm:py-20 px-6 bg-amber-50 rounded-2xl border border-dashed border-amber-300 text-amber-700"
          >
            <motion.div
              animate={{ rotate: [-6, 6, -6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl mb-3 inline-block"
            >
              🐾
            </motion.div>
            <p className="text-base font-medium">No pets yet</p>
            <p className="text-sm opacity-70 mb-5">
              Add your first pet to start booking appointments faster.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-block bg-linear-to-br from-amber-600 to-amber-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
            >
              + Add a pet
            </button>
          </motion.div>
        )}

        {/* Pet cards */}
        {!loading && pets.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {pets.map((pet) => {
              const next = nextAppointmentFor(pet, bookings);
              return (
                <motion.div
                  key={pet.id}
                  layout
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{
                    y: -6,
                    boxShadow: "0 18px 40px rgba(120,53,15,0.12)",
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="flex flex-col bg-white border border-amber-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.06)]"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shrink-0">
                      {PET_EMOJI[pet.species] || PET_EMOJI.Other}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-amber-900 truncate">
                        {pet.name}
                      </h2>
                      <p className="text-sm text-amber-700">
                        {pet.species} · {pet.breed}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      pet.gender,
                      pet.age != null && formatAge(pet.age),
                      pet.weight != null && formatWeight(pet.weight),
                    ]
                      .filter(Boolean)
                      .map((fact) => (
                        <span
                          key={fact}
                          className="rounded-full border px-3 py-0.5 text-xs font-medium bg-amber-50 border-amber-200 text-amber-700"
                        >
                          {fact}
                        </span>
                      ))}
                  </div>

                  <p className="text-sm text-stone-600 mb-5">
                    {next
                      ? `📅 Next: ${next.appointmentType}, ${formatDate(next.date)} · ${next.time}`
                      : "📅 No upcoming appointments"}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleBook(pet)}
                      className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                    >
                      Book appointment
                    </button>
                    <Link to={`/pets/${pet.id}`}>
                      <motion.span
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="inline-block bg-linear-to-br from-amber-600 to-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
                      >
                        View Profile →
                      </motion.span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Pets;

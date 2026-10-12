import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { bookingDraft } from "../services/bookingService";
import { clinicService } from "../services/clinicService";
import BookingSummary from "./BookingSummary";
import FormMessage from "./FormMessage";
import WithBookingDraft from "./WithBookingDraft";
import { backLinkClass, stepPillClass } from "./formStyles";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Monday-first, as clinics list their week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function SelectVet({ draft }) {
  const navigate = useNavigate();

  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clinicId = draft.clinic?.id;

  useEffect(() => {
    if (!clinicId) return;
    let active = true;
    clinicService
      .getVetsByClinic(clinicId)
      .then((list) => active && setVets(list))
      .catch(() => active && setError("Unable to load veterinarians."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [clinicId]);

  if (!draft.pet || !draft.appointment) return <Navigate to="/appointments" replace />;
  if (!draft.clinic) return <Navigate to="/select-clinic" replace />;

  const handleSelectVet = async (vet) => {
    try {
      await bookingDraft.update({ vetId: vet.id });
      navigate("/schedule");
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
        <motion.button
          type="button"
          onClick={() => navigate("/select-clinic")}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          className={backLinkClass}
        >
          ← Back to clinics
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className={stepPillClass}>👩‍⚕️ Choose a Veterinarian</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-amber-900 mb-2">
            Who should see {draft.pet.name}?
          </h1>
          <p className="text-amber-700 max-w-2xl">
            Veterinarians available at {draft.clinic.name}.
          </p>
        </motion.div>

        <BookingSummary draft={{ ...draft, vet: null }} />

        <FormMessage message={error} className="mb-6" />

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="bg-white border border-amber-100 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-5 bg-amber-100 rounded w-1/2 mb-4" />
                <div className="h-3 bg-amber-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-amber-100 rounded w-1/2 mb-6" />
                <div className="h-10 bg-amber-100 rounded-xl w-32" />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && vets.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-amber-300 rounded-3xl">
            <div className="text-5xl mb-4">🩺</div>
            <h2 className="text-xl font-semibold text-amber-900 mb-2">
              No veterinarians available
            </h2>
            <p className="text-sm text-amber-700">
              Please choose a different clinic.
            </p>
          </div>
        )}

        {!loading && vets.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {vets.map((vet) => (
              <motion.div
                key={vet.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 18px 40px rgba(120,53,15,0.12)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className={`bg-white border rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.06)] ${
                  draft.vet?.id === vet.id
                    ? "border-amber-500"
                    : "border-amber-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-amber-900">
                      {vet.name}
                    </h2>
                    <p className="text-sm text-amber-700 mt-1">
                      {vet.specialty}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
                      👩‍⚕️
                    </div>
                    <span className="text-xs font-medium text-amber-800">
                      ⭐ {vet.rating}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-stone-600 mb-3">
                  🎓 {vet.experience} years of experience
                </p>

                {vet.hours && (
                  <p className="text-sm text-stone-600 mb-3">🕐 {vet.hours}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {WEEK_ORDER.map((i) => (
                    <span
                      key={i}
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        vet.days.includes(i)
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "border-stone-200 text-stone-400 line-through"
                      }`}
                    >
                      {WEEKDAYS[i]}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end mt-5">
                  <motion.button
                    type="button"
                    onClick={() => handleSelectVet(vet)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-linear-to-br from-amber-600 to-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
                  >
                    Pick a Time →
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const SelectVetPage = () => (
  <WithBookingDraft>{(draft) => <SelectVet draft={draft} />}</WithBookingDraft>
);

export default SelectVetPage;

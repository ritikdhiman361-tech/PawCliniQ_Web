import { motion } from "framer-motion";

// "Appointment for" strip shown at the top of each booking step
// (originally inline in Clinics.jsx).
const BookingSummary = ({ draft }) => {
  if (!draft?.pet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white border border-amber-200 rounded-2xl px-5 py-4 mb-8 shadow-[0_2px_12px_rgba(120,53,15,0.06)]"
    >
      <p className="text-xs uppercase tracking-wide font-medium text-amber-600 mb-2">
        Appointment for
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="text-amber-900">
          🐾 <strong>{draft.pet.name}</strong>
        </span>
        <span className="text-amber-700">{draft.pet.typeLabel}</span>
        <span className="text-amber-700">{draft.pet.breedLabel}</span>
        <span className="text-amber-700">
          🩺 {draft.appointment?.typeLabel}
        </span>
        <span className="text-amber-700">
          {draft.appointment?.visitType === "home" ? "🏠 Home visit" : "🏥 Clinic visit"}
        </span>
        {draft.clinic && (
          <span className="text-amber-700">🏥 {draft.clinic.name}</span>
        )}
        {draft.vet && (
          <span className="text-amber-700">👩‍⚕️ {draft.vet.name}</span>
        )}
      </div>
    </motion.div>
  );
};

export default BookingSummary;

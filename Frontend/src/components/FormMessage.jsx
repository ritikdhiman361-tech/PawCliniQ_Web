import { AnimatePresence, motion } from "framer-motion";

const toneClasses = {
  error: "bg-red-50 border-red-200 text-red-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

// Inline error/success banner, the same style the booking form already used.
const FormMessage = ({ message, tone = "error", className = "" }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        key={message}
        role={tone === "error" ? "alert" : "status"}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`border text-sm rounded-xl px-4 py-3 ${toneClasses[tone]} ${className}`}
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

export default FormMessage;

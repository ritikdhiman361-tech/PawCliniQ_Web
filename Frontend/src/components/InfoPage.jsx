import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { stepPillClass } from "./formStyles";

const pages = {
  privacy: {
    pill: "🔒 Privacy policy",
    title: "How we handle your data",
    body: [
      "Your account, pet profiles and appointments are stored securely on our servers so you can access them from any device. Passwords are stored only as one-way hashes.",
      "Clinics you book with see the details of your appointment. We don't sell your data or share it with anyone else.",
    ],
  },
  terms: {
    pill: "📄 Terms of use",
    title: "Terms of use",
    body: [
      "PawCliniQ is in early access. Clinics, veterinarians and time slots shown here are sample data, and bookings are not yet sent to real clinics.",
      "For a real emergency, please contact your nearest veterinary hospital directly.",
    ],
  },
  notFound: {
    pill: "🐾 404",
    title: "This page wandered off",
    body: ["We couldn't find the page you were looking for."],
  },
};

// Simple content card for legal pages and the 404 route.
function InfoPage({ page }) {
  const { pill, title, body } = pages[page];

  return (
    <div className="relative min-h-[70vh] px-4 sm:px-8 py-10 md:py-16 overflow-hidden">
      <div
        className="blob w-72 h-72 -top-10 -left-10 bg-amber-300/25"
        style={{ animation: "blobFloat 16s ease-in-out infinite" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10"
      >
        <div className={stepPillClass}>{pill}</div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-4">
          {title}
        </h1>
        {body.map((paragraph) => (
          <p key={paragraph} className="text-sm text-amber-800 leading-relaxed mb-3">
            {paragraph}
          </p>
        ))}
        <Link
          to="/"
          className="inline-block mt-4 bg-linear-to-br from-amber-600 to-amber-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
        >
          ← Back to home
        </Link>
      </motion.div>
    </div>
  );
}

export default InfoPage;

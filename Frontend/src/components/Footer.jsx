import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// Fill these in with PawCliniQ's real details; anything left empty is hidden.
const CONTACT = {
  address: "Serving pet parents across Bengaluru",
  phone: "", // e.g. "+91 98xxx xxxxx"
  email: "", // e.g. "hello@pawcliniq.com"
  hours: "Clinic hours vary; some clinics are open 24/7",
};

// Your page URLs, e.g. "https://www.instagram.com/pawcliniq"; empty = hidden.
const socialLinks = [
  { label: "ig", name: "Instagram", href: "" },
  { label: "f", name: "Facebook", href: "" },
].filter((s) => s.href);

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const Footer = () => {
  return (
    <motion.footer
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="relative overflow-hidden bg-zinc-800 px-6 sm:px-10 md:px-16 pt-10 md:pt-12 pb-7 font-sans flex items-center justify-center"
    >
      {/* ambient glow, quiet enough not to fight the content */}
      <div
        className="blob w-72 h-72 -bottom-24 -left-16 bg-amber-500/10"
        style={{ animation: "blobFloat 14s ease-in-out infinite" }}
      />
      <div
        className="blob w-64 h-64 -top-20 right-0 bg-blue-400/10"
        style={{ animation: "blobFloatReverse 16s ease-in-out infinite" }}
      />

      <div className="relative w-full max-w-5xl">
        {/* Top section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-10">
          {/* Brand */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <span className="text-xl font-semibold text-amber-100">
                pawCliniq🐾
              </span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-5">
              Caring for your pets with love and expertise. Book appointments,
              track visits, and keep your furry friends healthy.
            </p>
          </motion.div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="flex items-center sm:items-end justify-start sm:justify-center gap-6"
            >
              {socialLinks.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  whileHover={{ scale: 1.18, rotate: 10, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="w-9 h-9 rounded-lg bg-zinc-600 flex items-center justify-center text-amber-200 text-sm hover:bg-zinc-500 transition-colors"
                >
                  {s.label}
                </motion.a>
              ))}
            </motion.div>
          )}

          {/* Contact */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <p className="text-amber-100 text-xs font-semibold uppercase tracking-widest mb-4 md:mb-6">
              Contact
            </p>
            <div className="flex flex-col gap-2">
              {CONTACT.address && (
                <span className="text-zinc-300 text-sm">📍 {CONTACT.address}</span>
              )}
              {CONTACT.phone && (
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="text-zinc-300 text-sm hover:text-white">
                  📞 {CONTACT.phone}
                </a>
              )}
              {CONTACT.email && (
                <a href={`mailto:${CONTACT.email}`} className="text-zinc-300 text-sm hover:text-white">
                  ✉️ {CONTACT.email}
                </a>
              )}
              {CONTACT.hours && (
                <span className="text-zinc-300 text-sm">🕐 {CONTACT.hours}</span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          variants={itemVariants}
          className="border-t border-zinc-600 pt-5 flex flex-col sm:flex-row gap-3 justify-between items-center text-center sm:text-left"
        >
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} PawCliniQ. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link
              to="/privacy"
              className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
            >
              Privacy policy
            </Link>
            <Link
              to="/terms"
              className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
            >
              Terms of use
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;

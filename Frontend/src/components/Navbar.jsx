import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/useAuth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/clinics", label: "Clinics" },
  { to: "/appointments", label: "Book Appointment" },
  { to: "/bookings", label: "My Appointments" },
  { to: "/pets", label: "My Pets" },
];

const loginLink = { to: "/login", label: "Login" };

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user ? navLinks : [...navLinks, loginLink];

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `relative z-10 hover:text-yellow-400 transition-colors ${
      isActive ? "font-bold text-yellow-900" : "text-yellow-800"
    }`;

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="sticky top-0 z-40 bg-yellow-100/70 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.05)] px-4 sm:px-8 md:px-12 lg:px-20 py-4 w-full"
    >
      <div className="flex items-center justify-between">
        <Link to="/" onClick={() => setIsOpen(false)}>
          <motion.div
            whileHover={{ scale: 1.06, rotate: [-1, 1, -1, 0] }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-yellow-800 hover:text-yellow-400 cursor-pointer"
          >
            pawCliniq🐾
          </motion.div>
        </Link>

        {/* Desktop links */}
        <div className="hidden xl:flex items-center whitespace-nowrap gap-2 text-gray-700 font-medium">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="relative px-4 py-2 rounded-full"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="navActivePill"
                      className="absolute inset-0 rounded-full bg-white/70 shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className={linkClass({ isActive })}>{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {user && (
            <motion.button
              type="button"
              onClick={handleLogout}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              title={`Logged in as ${user.name}`}
              className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-yellow-800/20 text-yellow-800 hover:text-yellow-400 hover:bg-white/50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85, rotate: -8 }}
          className="xl:hidden text-yellow-800"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="xl:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 text-gray-700 font-medium pt-4 pb-2">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <NavLink
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className={linkClass}
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
              {user && (
                <motion.button
                  type="button"
                  onClick={handleLogout}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: links.length * 0.06, duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 text-left text-yellow-800 hover:text-yellow-400 transition-colors"
                >
                  <LogOut size={16} />
                  Logout ({user.name.split(" ")[0]})
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;

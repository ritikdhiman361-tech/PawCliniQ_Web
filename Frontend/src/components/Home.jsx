import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { homeFor, useAuth } from "../context/useAuth";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
};

const lineVariant = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const checklist = [
  "Certified, experienced groomers & vets",
  "Flexible time slots, including 24/7 clinics",
  "Anxiety-free environment for all pets",
  "All breeds and pet types welcome",
];

const Home = () => {
  const { user } = useAuth();
  // Clinic staff and admins don't book; send them to their own page.
  const staffHome = user && user.role !== "user" ? homeFor(user) : null;

  return (
    <div className="relative bg-white text-gray-900 min-h-screen flex flex-col lg:flex-row lg:justify-between items-center gap-10 lg:gap-16 px-6 sm:px-10 md:px-16 lg:px-20 py-10 lg:py-15 overflow-hidden">
      {/* Decorative floating gradient accents — purely visual, no interactivity */}
      <div
        className="blob w-80 h-80 -top-10 -left-10 bg-amber-300/30"
        style={{ animation: "blobFloat 15s ease-in-out infinite" }}
      />

      <div
        className="blob w-72 h-72 bottom-0 right-10 bg-blue-300/25"
        style={{ animation: "blobFloatReverse 17s ease-in-out infinite" }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative flex flex-col items-center lg:items-start text-center lg:text-left"
      >
        <motion.h1
          variants={lineVariant}
          className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-yellow-900"
        >
          Book your
        </motion.h1>

        <motion.h1
          variants={lineVariant}
          className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-yellow-900"
        >
          Pet's Next
        </motion.h1>

        <motion.h1
          variants={lineVariant}
          className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-blue-500"
        >
          Appointment
        </motion.h1>

        <motion.h1
          variants={lineVariant}
          className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-yellow-900"
        >
          in just few seconds !!
        </motion.h1>

        <motion.div
          variants={lineVariant}
          className="py-6 lg:py-10 max-w-md lg:max-w-lg"
        >
          <p className="text-base sm:text-lg lg:text-2xl text-gray-600 font-extralight">
            From grooming to health checkups, we offer professional pet care you
            can trust. Schedule in minutes — your pet deserves the best.
          </p>
        </motion.div>

        <motion.div
          variants={lineVariant}
          className="inline-block text-left space-y-1"
        >
          {checklist.map((item) => (
            <motion.p
              key={item}
              whileHover={{ x: 6 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
              className="text-sm sm:text-base text-gray-900 transition-colors duration-150 hover:text-amber-700 cursor-default"
            >
              ✔ {item}
            </motion.p>
          ))}
        </motion.div>

        <motion.div variants={lineVariant}>
          <Link to={staffHome ?? "/appointments"} className="inline-block">
            <motion.span
              whileHover={{
                scale: 1.05,
                boxShadow: "0 12px 32px rgba(180,83,9,0.35)",
              }}
              whileTap={{ scale: 0.96 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 18,
              }}
              className="inline-block mt-10 bg-amber-700 bg-linear-to-br from-amber-600 to-amber-800 text-white px-8 py-3.5 rounded-2xl text-base font-medium shadow-[0_6px_20px_rgba(180,83,9,0.3)] cursor-pointer"
            >
              {staffHome ? "Go to your dashboard →" : "Book an appointment →"}
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.3,
          type: "spring",
          stiffness: 200,
          damping: 16,
        }}
        className="relative shrink-0"
      >
        <motion.div
          animate={{
            y: [0, -18, 0],
            rotate: [0, 1.5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.05 }}
        >
          <img
            className="w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 lg:w-140 lg:h-140 rounded-4xl object-cover shadow-2xl"
            src="/Homepage_Golden retriever.jpg"
            alt="Dog image"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;

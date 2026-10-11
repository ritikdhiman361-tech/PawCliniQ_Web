import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import BookingsPage from "./components/Bookings";
import Footer from "./components/Footer";
import BookingForm from "./components/Forms";
import Home from "./components/Home";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Clinics from "./components/Clinics";
import SelectVet from "./components/SelectVet";
import Schedule from "./components/Schedule";
import InfoPage from "./components/InfoPage";
import Pets from "./components/Pets";
import PetProfile from "./components/PetProfile";

// Purely decorative, non-interactive backdrop shared across every page —
// a faint animated grid plus a few slow-drifting gradient blobs. It sits
// behind everything (pointer-events-none, negative z-index) so it never
// interferes with the actual product.
const AmbientBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-grid opacity-60" />
    <div
      className="blob w-26rem h-26rem -top-24 -left-24 bg-amber-400/30"
      style={{ animation: "blobFloat 16s ease-in-out infinite" }}
    />
    <div
      className="blob w-22rem h-22rem top-1/3 -right-20 bg-blue-300/30"
      style={{ animation: "blobFloatReverse 18s ease-in-out infinite" }}
    />
    <div
      className="blob w-18rem h-18rem bottom-0 left-1/4 bg-orange-300/20"
      style={{ animation: "blobFloat 20s ease-in-out infinite" }}
    />
  </div>
);

// Gives every routed page a consistent, snappy enter/exit transition.
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const page = (element) => <PageTransition>{element}</PageTransition>;

const protectedPage = (element) => (
  <ProtectedRoute>{page(element)}</ProtectedRoute>
);

const App = () => {
  const location = useLocation();

  return (
    <div className="relative">
      <AmbientBackground />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={page(<Home />)} />
          <Route path="/login" element={page(<Login />)} />
          {/* Matching is case-insensitive, so the old /Clinics URL still works. */}
          <Route path="/clinics" element={page(<Clinics />)} />
          <Route path="/privacy" element={page(<InfoPage page="privacy" />)} />
          <Route path="/terms" element={page(<InfoPage page="terms" />)} />

          {/* Booking flow: pet details → clinic → vet → date & time */}
          <Route path="/appointments" element={protectedPage(<BookingForm />)} />
          <Route path="/select-clinic" element={protectedPage(<Clinics />)} />
          <Route path="/select-vet" element={protectedPage(<SelectVet />)} />
          <Route path="/schedule" element={protectedPage(<Schedule />)} />

          {/* Booked appointments */}
          <Route path="/bookings" element={protectedPage(<BookingsPage />)} />

          {/* Pet profiles */}
          <Route path="/pets" element={protectedPage(<Pets />)} />
          <Route path="/pets/:petId" element={protectedPage(<PetProfile />)} />

          <Route path="*" element={page(<InfoPage page="notFound" />)} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default App;

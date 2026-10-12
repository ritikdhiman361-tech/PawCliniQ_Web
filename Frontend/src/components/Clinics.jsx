import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { APPOINTMENT_TYPES } from "../data/mockData";
import { bookingDraft } from "../services/bookingService";
import { clinicService } from "../services/clinicService";
import BookingSummary from "./BookingSummary";
import FormMessage from "./FormMessage";
import Spinner from "./Spinner";
import WithBookingDraft from "./WithBookingDraft";

// Opens Google Maps (the app on phones) with directions from the user's
// location to the clinic.
const directionsUrl = (clinic) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    [clinic.name, clinic.address, clinic.location].filter(Boolean).join(", "),
  )}`;

const serviceLabel = (value) =>
  APPOINTMENT_TYPES.find((t) => t.value === value)?.label || value;

// `bookingData` is the in-progress booking on the /select-clinic step, and
// null when browsing at /clinics (public).
function Clinics({ bookingData }) {
  const navigate = useNavigate();

  const isBookingStep = Boolean(bookingData);
  const [selecting, setSelecting] = useState(null);
  const serviceType = bookingData?.appointment?.type;
  const visitType = bookingData?.appointment?.visitType;

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Saving the chosen clinic failed; separate from `error` (loading the
  // list), whose "Try again" reloads the list.
  const [selectError, setSelectError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ---------------------------------------------
  // FETCH CLINICS
  // ---------------------------------------------

  useEffect(() => {
    let active = true;

    clinicService
      .getClinics(serviceType, visitType)
      .then((list) => active && setClinics(list))
      .catch(
        (err) =>
          active &&
          setError(err.message || "Unable to load clinics. Please try again."),
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [serviceType, visitType, reloadKey]);

  // ---------------------------------------------
  // SELECT CLINIC
  // ---------------------------------------------

  const handleSelectClinic = async (clinic) => {
    // Browsing: pick the clinic first, then fill in pet details. The form
    // saves it to the draft (after login, if needed).
    if (!isBookingStep) {
      navigate(`/appointments?clinic=${encodeURIComponent(clinic.id)}`);
      return;
    }
    setSelecting(clinic.id);
    setSelectError("");
    try {
      await bookingDraft.update({ clinicId: clinic.id });
      navigate("/select-vet");
    } catch (err) {
      setSelectError(err.message);
      setSelecting(null);
    }
  };

  // ---------------------------------------------
  // GO BACK
  // ---------------------------------------------

  const handleBack = () => {
    navigate(isBookingStep ? "/appointments" : "/");
  };

  // Booking step reached before the pet details form was completed (e.g. a
  // bookmarked URL, or "Book" from a pet profile then straight here).
  if (isBookingStep && (!bookingData.pet || !bookingData.appointment)) {
    return <Navigate to="/appointments" replace />;
  }

  return (
    <div className="relative min-h-screen bg-amber-50/40 px-4 sm:px-8 py-10 md:py-16 overflow-hidden">
      {/* Background Decorations */}

      <div
        className="blob w-72 h-72 -top-20 -left-16 bg-amber-300/20"
        style={{
          animation: "blobFloat 16s ease-in-out infinite",
        }}
      />

      <div
        className="blob w-72 h-72 bottom-0 -right-16 bg-blue-300/20"
        style={{
          animation: "blobFloatReverse 18s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Back Button */}

        <motion.button
          type="button"
          onClick={handleBack}
          initial={{
            opacity: 0,
            x: -10,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          whileHover={{
            x: -4,
          }}
          className="text-sm text-amber-700 hover:text-amber-900 font-medium mb-6"
        >
          {isBookingStep ? "← Back to pet details" : "← Back to home"}
        </motion.button>

        {/* Header */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className="mb-8"
        >
          <div className="inline-block bg-amber-100 border border-amber-300 text-amber-700 rounded-full px-4 py-1 text-xs font-medium mb-3">
            🏥 Choose a Clinic
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-amber-900 mb-2">
            Find the right clinic
          </h1>

          <p className="text-amber-700 max-w-2xl">
            {isBookingStep
              ? `Clinics offering ${bookingData.appointment.typeLabel.toLowerCase()} near you. Select one to view available veterinarians.`
              : "Trusted veterinary clinics across Bengaluru. Pick one to start booking."}
          </p>
        </motion.div>

        {/* Booking Summary */}

        <BookingSummary draft={bookingData} />

        {/* Errors */}

        <FormMessage message={selectError} className="mb-6" />

        {error && (
          <div className="mb-6">
            <FormMessage message={error} />
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setReloadKey((k) => k + 1);
              }}
              className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((item) => (
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

        {/* No Clinics */}

        {!loading && !error && clinics.length === 0 && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="text-center py-20 bg-white border border-dashed border-amber-300 rounded-3xl"
          >
            <div className="text-5xl mb-4">🏥</div>

            <h2 className="text-xl font-semibold text-amber-900 mb-2">
              No clinics available
            </h2>

            <p className="text-sm text-amber-700">
              {serviceType
                ? "No clinic currently offers this appointment type. Try a different one."
                : "We couldn't find any clinics at the moment."}
            </p>
          </motion.div>
        )}

        {/* Clinic Cards */}

        {!loading && clinics.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},

              show: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {clinics.map((clinic) => (
              <motion.div
                key={clinic.id}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },

                  show: {
                    opacity: 1,
                    y: 0,
                  },
                }}
                whileHover={{
                  y: -6,

                  boxShadow: "0 18px 40px rgba(120,53,15,0.12)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
                className="bg-white border border-amber-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(120,53,15,0.06)]"
              >
                {/* Clinic Header */}

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-amber-900">
                      {clinic.name}
                    </h2>

                    {clinic.location && (
                      <p className="text-sm text-amber-700 mt-1">
                        📍 {clinic.location}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
                      🏥
                    </div>
                    {clinic.rating > 0 && (
                      <span className="text-xs font-medium text-amber-800">
                        ⭐ {clinic.rating}
                      </span>
                    )}
                    {clinic.open24Hours && (
                      <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Open 24/7
                      </span>
                    )}
                    {clinic.homeVisits && (
                      <span className="rounded-full bg-sky-50 border border-sky-300 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        🏠 Home visits
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}

                {clinic.address && (
                  <p className="text-sm text-stone-600 mb-3">
                    {clinic.address}
                  </p>
                )}

                {/* Phone */}

                {clinic.phone && (
                  <p className="text-sm text-stone-600 mb-2">
                    📞 {clinic.phone}
                  </p>
                )}

                {/* Email */}

                {clinic.email && (
                  <p className="text-sm text-stone-600 mb-4">
                    ✉️ {clinic.email}
                  </p>
                )}

                {/* Optional Description */}

                {clinic.description && (
                  <p className="text-sm text-stone-500 leading-relaxed mb-5">
                    {clinic.description}
                  </p>
                )}

                {/* Services */}

                {clinic.services?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clinic.services.map((service) => (
                      <span
                        key={service}
                        className={`rounded-full border px-3 py-0.5 text-xs font-medium ${
                          service === serviceType
                            ? "bg-amber-100 border-amber-400 text-amber-800"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                      >
                        {serviceLabel(service)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Button */}

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <span className="text-xs text-stone-500">
                    {clinic.hours && `🕐 ${clinic.hours}`}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={directionsUrl(clinic)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-700 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors"
                    >
                      📍 Get directions
                    </a>
                    <motion.button
                      type="button"
                      onClick={() => handleSelectClinic(clinic)}
                      disabled={selecting !== null}
                      whileHover={{
                        scale: 1.04,
                      }}
                      whileTap={{
                        scale: 0.96,
                      }}
                      className="bg-linear-to-br from-amber-600 to-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_2px_8px_rgba(180,83,9,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {selecting === clinic.id && <Spinner />}
                      {isBookingStep ? "View Veterinarians →" : "Book here →"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ClinicsPage() {
  const location = useLocation();
  if (location.pathname.toLowerCase() !== "/select-clinic") {
    return <Clinics bookingData={null} />;
  }
  return (
    <WithBookingDraft>{(draft) => <Clinics bookingData={draft} />}</WithBookingDraft>
  );
}

export default ClinicsPage;

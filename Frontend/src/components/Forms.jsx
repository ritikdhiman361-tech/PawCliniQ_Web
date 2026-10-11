import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import { motion } from "framer-motion";
import { APPOINTMENT_TYPES, BREEDS_BY_TYPE, PET_TYPES } from "../data/mockData";
import { petService } from "../services/petService";
import { bookingDraft } from "../services/bookingService";
import FormMessage from "./FormMessage";
import Label from "./Label";
import Spinner from "./Spinner";
import WithBookingDraft from "./WithBookingDraft";
import {
  inputClass,
  primaryBtnClass,
  selectStyles,
  stepPillClass,
} from "./formStyles";

// ---------------------------------------------
// OPTIONS
// ---------------------------------------------

const toOption = (label) => ({
  value: label.toLowerCase().replace(/\s+/g, "_"),
  label,
});

const petOptions = PET_TYPES.map(toOption);

const breedOptionsByPetType = Object.fromEntries(
  Object.entries(BREEDS_BY_TYPE).map(([type, breeds]) => [
    type.toLowerCase(),
    breeds.map(toOption),
  ]),
);

const findPetType = (label) =>
  petOptions.find((o) => o.label.toLowerCase() === label?.toLowerCase()) ||
  null;

// Breeds outside the preset list (or for "Other") come back as a custom
// option so a saved pet always restores fully.
const findBreed = (petType, label) => {
  if (!petType || !label) return null;
  return (
    (breedOptionsByPetType[petType.value] || []).find(
      (o) => o.label.toLowerCase() === label.toLowerCase(),
    ) || { value: label.toLowerCase(), label }
  );
};

// ---------------------------------------------
// ANIMATIONS
// ---------------------------------------------

const fieldContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fieldItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

// ---------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------

// `draft` restores anything entered earlier in this booking (e.g. after
// "Back", a refresh, or on another device).
function BookingForm({ draft }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPetType = findPetType(draft.pet?.typeLabel);

  const [petType, setPetType] = useState(initialPetType);
  const [breed, setBreed] = useState(() =>
    findBreed(initialPetType, draft.pet?.breedLabel),
  );
  const [appointmentType, setAppointmentType] = useState(
    () =>
      APPOINTMENT_TYPES.find((o) => o.value === draft.appointment?.type) ||
      null,
  );
  const [petName, setPetName] = useState(draft.pet?.name || "");
  const [problemDescription, setProblemDescription] = useState(
    draft.appointment?.notes || "",
  );
  const [presetClinic, setPresetClinic] = useState(draft.clinic || null);
  const [savedPets, setSavedPets] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // A clinic picked while browsing arrives as ?clinic= and is already saved
  // to the draft; drop it from the URL so a refresh doesn't re-apply it.
  useEffect(() => {
    if (searchParams.has("clinic")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    let active = true;
    petService
      .getPets()
      .then((pets) => {
        if (active) setSavedPets(pets);
      })
      // Saved-pet shortcuts are optional; the form works without them.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selectedSavedPet = savedPets.find(
    (p) => p.name.toLowerCase() === petName.trim().toLowerCase(),
  );

  const handlePickSavedPet = (pet) => {
    const type = findPetType(pet.species);
    setPetName(pet.name);
    setPetType(type);
    setBreed(findBreed(type, pet.breed));
    setError("");
  };

  const handleNewPet = () => {
    setPetName("");
    setPetType(null);
    setBreed(null);
  };

  // ---------------------------------------------
  // PET TYPE CHANGE
  // ---------------------------------------------

  const handlePetTypeChange = (selectedPetType) => {
    setPetType(selectedPetType);

    // Clear previous breed because it may not
    // belong to the newly selected pet type.
    setBreed(null);

    setError("");
  };

  const breedOptions = petType
    ? breedOptionsByPetType[petType.value] || []
    : [];

  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------

  const validateForm = () => {
    if (!petName.trim()) return "Please enter your pet's name.";
    if (!petType) return "Please select your pet type.";
    if (!breed?.label.trim()) return "Please select your pet's breed.";
    if (!appointmentType) return "Please select an appointment type.";
    if (presetClinic && !presetClinic.services.includes(appointmentType.value))
      return `${presetClinic.name} doesn't offer ${appointmentType.label.toLowerCase()}. Choose another appointment type or clinic.`;
    return "";
  };

  // ---------------------------------------------
  // FIND CLINICS
  // ---------------------------------------------

  const handleFindClinics = async () => {
    const validationError = validateForm();
    setError(validationError);
    if (validationError) return;

    // Nothing is booked yet — this only saves the pet details for the next
    // steps: Clinic → Veterinarian → Date & Time → Confirmation.
    setSaving(true);
    try {
      await bookingDraft.update({
        pet: {
          name: petName.trim(),
          species: petType.label,
          breed: breed.label.trim(),
        },
        serviceType: appointmentType.value,
        notes: problemDescription.trim(),
        clinicId: presetClinic?.id ?? null,
        vetId: null,
      });
      navigate(presetClinic ? "/select-vet" : "/select-clinic");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // ---------------------------------------------
  // UI
  // ---------------------------------------------

  return (
    <div className="relative min-h-[80vh] px-4 sm:px-8 py-8 md:py-16 font-sans overflow-hidden">
      {/* Background Blob */}

      <div
        className="blob w-72 h-72 -top-10 -left-10 bg-amber-300/25"
        style={{
          animation: "blobFloat 16s ease-in-out infinite",
        }}
      />

      <div
        className="blob w-64 h-64 bottom-0 -right-10 bg-blue-300/20"
        style={{
          animation: "blobFloatReverse 18s ease-in-out infinite",
        }}
      />

      {/* Main Card */}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-[0_4px_24px_rgba(120,53,15,0.10)] border border-amber-200 p-6 sm:p-10"
      >
        {/* Header */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={stepPillClass}>🐾 Book an Appointment</div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-2">
            What does your pet need?
          </h1>

          <p className="text-sm text-amber-700 mb-8">
            Tell us about your pet and we'll help you find the right clinic and
            veterinarian.
          </p>
        </motion.div>

        {/* Saved pets */}

        {savedPets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between gap-3">
              <Label icon="💛">Your pets</Label>
              <Link
                to="/pets"
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline mb-1.5"
              >
                Manage pets
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedPets.map((pet) => {
                const isActive = selectedSavedPet?.id === pet.id;
                return (
                  <motion.button
                    key={pet.id}
                    type="button"
                    onClick={() => handlePickSavedPet(pet)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={isActive}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-amber-700 border-amber-700 text-white shadow-[0_2px_8px_rgba(180,83,9,0.3)]"
                        : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    🐾 {pet.name}
                    <span className="opacity-70 font-normal">
                      {" "}
                      · {pet.breed}
                    </span>
                  </motion.button>
                );
              })}
              <motion.button
                type="button"
                onClick={handleNewPet}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-dashed border-amber-400 px-4 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                + New pet
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Error */}

        <FormMessage message={error} className="mb-6" />

        {/* Form */}

        <motion.div
          variants={fieldContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {/* Pet Name */}

          <motion.div variants={fieldItem}>
            <Label icon="🐾" htmlFor="pet-name">
              Pet's name
            </Label>

            <input
              id="pet-name"
              type="text"
              className={inputClass}
              placeholder="e.g. Buddy"
              value={petName}
              onChange={(e) => {
                setPetName(e.target.value);
                setError("");
              }}
            />
          </motion.div>

          {/* Pet Type */}

          <motion.div variants={fieldItem}>
            <Label icon="🐶">Pet type</Label>

            <Select
              inputId="pet-type"
              options={petOptions}
              value={petType}
              onChange={handlePetTypeChange}
              placeholder="Select pet type"
              styles={selectStyles}
            />
          </motion.div>

          {/* Breed */}

          <motion.div variants={fieldItem}>
            <Label icon="🦴">Breed</Label>

            {petType?.value === "other" ? (
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Hamster"
                value={breed?.label || ""}
                onChange={(e) => {
                  setBreed({ value: "other", label: e.target.value });
                  setError("");
                }}
              />
            ) : (
              <Select
                options={breedOptions}
                value={breed}
                onChange={(selectedBreed) => {
                  setBreed(selectedBreed);
                  setError("");
                }}
                placeholder={petType ? "Select breed" : "Select pet type first"}
                isDisabled={!petType}
                styles={selectStyles}
              />
            )}
          </motion.div>

          {/* Appointment Type */}

          <motion.div variants={fieldItem}>
            <Label icon="🩺">Appointment type</Label>

            <Select
              options={APPOINTMENT_TYPES}
              value={appointmentType}
              onChange={(selectedType) => {
                setAppointmentType(selectedType);
                setError("");
              }}
              placeholder="Select appointment"
              styles={selectStyles}
            />
          </motion.div>

          {/* Problem Description */}

          <motion.div variants={fieldItem} className="sm:col-span-2">
            <Label icon="📋" htmlFor="pet-notes">
              Tell us more
              <span className="normal-case opacity-60 ml-1">(optional)</span>
            </Label>

            <textarea
              id="pet-notes"
              rows="4"
              maxLength={500}
              className={`${inputClass} resize-none`}
              placeholder="Briefly describe your pet's symptoms or reason for the visit..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
            />
          </motion.div>
        </motion.div>

        {/* Next Step Preview */}

        <motion.div
          variants={fieldItem}
          initial="hidden"
          animate="show"
          className="mt-7 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-2">
            Next step
          </p>

          {presetClinic ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-amber-900">
                You'll choose a veterinarian at{" "}
                <strong>{presetClinic.name}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPresetClinic(null);
                  // Also saved by "Find Clinics"; this just keeps the draft
                  // in step if they leave first.
                  bookingDraft.update({ clinicId: null }).catch(() => {});
                  setError("");
                }}
                className="text-xs font-medium text-amber-700 hover:text-amber-900 underline"
              >
                Change clinic
              </button>
            </div>
          ) : (
            <p className="text-sm text-amber-900">
              We'll show you clinics where you can choose the right veterinarian
              for your pet.
            </p>
          )}
        </motion.div>

        {/* Find Clinics Button */}

        <div className="flex justify-end mt-7">
          <motion.button
            type="button"
            onClick={handleFindClinics}
            disabled={saving}
            whileHover={{
              scale: 1.04,
              boxShadow: "0 14px 30px rgba(180,83,9,0.4)",
            }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 18 }}
            className={`${primaryBtnClass} w-full sm:w-auto`}
          >
            {saving && <Spinner />}
            {presetClinic ? "Choose Veterinarian →" : "Find Clinics →"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function BookingFormPage() {
  const [searchParams] = useSearchParams();
  const clinicId = searchParams.get("clinic");
  return (
    <WithBookingDraft changes={clinicId ? { clinicId } : undefined}>
      {(draft) => <BookingForm draft={draft} />}
    </WithBookingDraft>
  );
}

export default BookingFormPage;

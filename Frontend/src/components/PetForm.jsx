import { useState } from "react";
import Select from "react-select";
import { motion } from "framer-motion";
import { BREEDS_BY_TYPE, PET_TYPES } from "../data/mockData";
import FormMessage from "./FormMessage";
import Label from "./Label";
import Spinner from "./Spinner";
import { inputClass, primaryBtnClass, selectStyles } from "./formStyles";

const asOption = (label) => (label ? { value: label, label } : null);
const typeOptions = PET_TYPES.map(asOption);
const GENDERS = ["Male", "Female"];

const validate = (form) => {
  if (form.name.trim().length < 2) return "Please enter your pet's name.";
  if (!form.species) return "Please select your pet's type.";
  if (!form.breed.trim()) return "Please select your pet's breed.";
  if (form.age !== "" && !(Number(form.age) >= 0 && Number(form.age) <= 30))
    return "Age should be between 0 and 30 years.";
  if (
    form.weight !== "" &&
    !(Number(form.weight) > 0 && Number(form.weight) <= 150)
  )
    return "Weight should be between 0 and 150 kg.";
  return "";
};

// Add / edit form for a pet profile. `onSubmit` receives the form values and
// may throw — its message is shown inline.
function PetForm({ initialPet, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => ({
    name: initialPet?.name || "",
    species: initialPet?.species || "",
    breed: initialPet?.breed || "",
    gender: initialPet?.gender || "",
    age: initialPet?.age ?? "",
    weight: initialPet?.weight ?? "",
    notes: initialPet?.notes || "",
  }));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const breedOptions = (BREEDS_BY_TYPE[form.species] || []).map(asOption);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) return setError(validationError);

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormMessage message={error} className="mb-5" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <Label icon="🐾" htmlFor="pet-form-name">
            Pet's name
          </Label>
          <input
            id="pet-form-name"
            type="text"
            maxLength={30}
            className={inputClass}
            placeholder="e.g. Buddy"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <Label icon="🐶">Pet type</Label>
          <Select
            options={typeOptions}
            value={asOption(form.species)}
            onChange={(option) => {
              // A breed from the old type no longer applies.
              setForm((prev) => ({ ...prev, species: option.value, breed: "" }));
              setError("");
            }}
            placeholder="Select pet type"
            styles={selectStyles}
          />
        </div>

        <div>
          <Label icon="🦴">Breed</Label>
          {form.species === "Other" ? (
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Hamster"
              value={form.breed}
              onChange={(e) => set("breed", e.target.value)}
            />
          ) : (
            <Select
              options={breedOptions}
              value={asOption(form.breed)}
              onChange={(option) => set("breed", option.value)}
              placeholder={form.species ? "Select breed" : "Select pet type first"}
              isDisabled={!form.species}
              styles={selectStyles}
            />
          )}
        </div>

        <div>
          <Label icon="⚧">
            Gender
            <span className="normal-case opacity-60 ml-1">(optional)</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map((gender) => {
              const isActive = form.gender === gender;
              return (
                <motion.button
                  key={gender}
                  type="button"
                  onClick={() => set("gender", isActive ? "" : gender)}
                  whileTap={{ scale: 0.96 }}
                  aria-pressed={isActive}
                  className={`rounded-2xl border-2 py-3 text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-linear-to-br from-amber-600 to-amber-800 border-amber-700 text-white"
                      : "bg-amber-50 border-amber-700 text-amber-900 hover:bg-white"
                  }`}
                >
                  {gender === "Male" ? "♂" : "♀"} {gender}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <Label icon="🎂" htmlFor="pet-form-age">
            Age (years)
            <span className="normal-case opacity-60 ml-1">(optional)</span>
          </Label>
          <input
            id="pet-form-age"
            type="number"
            min="0"
            max="30"
            step="0.5"
            inputMode="decimal"
            className={inputClass}
            placeholder="e.g. 3"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
          />
        </div>

        <div>
          <Label icon="⚖️" htmlFor="pet-form-weight">
            Weight (kg)
            <span className="normal-case opacity-60 ml-1">(optional)</span>
          </Label>
          <input
            id="pet-form-weight"
            type="number"
            min="0"
            max="150"
            step="0.1"
            inputMode="decimal"
            className={inputClass}
            placeholder="e.g. 25"
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Label icon="📋" htmlFor="pet-form-notes">
            Health notes
            <span className="normal-case opacity-60 ml-1">(optional)</span>
          </Label>
          <textarea
            id="pet-form-notes"
            rows="3"
            maxLength={500}
            className={`${inputClass} resize-none`}
            placeholder="Allergies, medications, temperament — anything the vet should know."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-7">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-amber-700 hover:text-amber-900 rounded-xl px-5 py-3 text-[15px] font-medium"
          >
            Cancel
          </button>
        )}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={
            submitting
              ? {}
              : { scale: 1.04, boxShadow: "0 14px 30px rgba(180,83,9,0.4)" }
          }
          whileTap={submitting ? {} : { scale: 0.96 }}
          transition={{ type: "spring", stiffness: 340, damping: 18 }}
          className={primaryBtnClass}
        >
          {submitting && <Spinner />}
          {submitting ? "Saving…" : submitLabel}
        </motion.button>
      </div>
    </form>
  );
}

export default PetForm;

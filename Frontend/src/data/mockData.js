// Fixed UI options. Clinics, vets and everything users create come from the
// API (see src/services); these are just the choices shown in forms.

export const APPOINTMENT_TYPES = [
  { value: "checkup", label: "Routine Checkup" },
  { value: "vaccination", label: "Vaccination" },
  { value: "grooming", label: "Grooming" },
  { value: "emergency", label: "Emergency" },
];

export const VISIT_TYPES = [
  { value: "clinic", label: "Clinic visit", icon: "🏥", hint: "Visit the clinic" },
  { value: "home", label: "Home visit", icon: "🏠", hint: "The vet comes to you" },
];

// Shared by sign-up, the booking form and pet profiles.
export const PET_TYPES = ["Dog", "Cat", "Rabbit", "Bird", "Other"];

export const BREEDS_BY_TYPE = {
  Dog: [
    "Golden Retriever",
    "Labrador",
    "German Shepherd",
    "Husky",
    "Beagle",
    "Pug",
  ],
  Cat: ["Persian Cat", "Siamese", "Maine Coon", "British Shorthair", "Bengal"],
  Rabbit: ["Holland Lop", "Dutch", "Angora", "Rex"],
  Bird: ["Parakeet", "Cockatiel", "Macaw", "Lovebird"],
};

export const PET_EMOJI = {
  Dog: "🐶",
  Cat: "🐱",
  Rabbit: "🐰",
  Bird: "🐦",
  Other: "🐾",
};

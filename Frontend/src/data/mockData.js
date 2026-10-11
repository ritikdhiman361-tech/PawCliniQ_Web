// Fixed UI options. Clinics, vets and everything users create come from the
// API (see src/services); these are just the choices shown in forms.

export const APPOINTMENT_TYPES = [
  { value: "checkup", label: "Routine Checkup" },
  { value: "vaccination", label: "Vaccination" },
  { value: "grooming", label: "Grooming" },
  { value: "emergency", label: "Emergency" },
];

export const TIME_SLOTS = {
  Morning: ["09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
  Afternoon: [
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
  ],
};

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

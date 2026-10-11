import { api } from "./api";

// 0.5 → "6 months", 1 → "1 year", 3 → "3 years", null → "—"
export const formatAge = (age) => {
  if (age === null || age === undefined || age === "") return "—";
  if (age < 1) return `${Math.round(age * 12)} months`;
  return `${age} year${age === 1 ? "" : "s"}`;
};

export const formatWeight = (weight) =>
  weight === null || weight === undefined || weight === "" ? "—" : `${weight} kg`;

// All calls act on the logged-in user's pets; the server enforces ownership.
export const petService = {
  getPets: () => api("/pets").then((d) => d.pets),

  // null when the pet doesn't exist (or isn't yours).
  getPet: (id) =>
    api(`/pets/${encodeURIComponent(id)}`)
      .then((d) => d.pet)
      .catch((err) => {
        if (err.status === 404) return null;
        throw err;
      }),

  // A second pet with the same name (any case) is rejected by the server.
  createPet: (profile) =>
    api("/pets", { method: "POST", body: profile }).then((d) => d.pet),

  updatePet: (id, profile) =>
    api(`/pets/${encodeURIComponent(id)}`, { method: "PUT", body: profile }).then(
      (d) => d.pet,
    ),

  // Appointment history stays in bookings; only the profile is removed.
  deletePet: (id) =>
    api(`/pets/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

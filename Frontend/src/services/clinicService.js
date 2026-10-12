import { api } from "./api";

export const clinicService = {
  // Optionally only clinics offering a given appointment type and, for
  // visitType "home", home visits.
  getClinics: (serviceType, visitType) => {
    const params = new URLSearchParams();
    if (serviceType) params.set("service", serviceType);
    if (visitType === "home") params.set("visit", "home");
    const query = params.toString();
    return api(query ? `/clinics?${query}` : "/clinics").then((d) => d.clinics);
  },

  getVetsByClinic: (clinicId) =>
    api(`/clinics/${encodeURIComponent(clinicId)}/vets`).then((d) => d.vets),
};

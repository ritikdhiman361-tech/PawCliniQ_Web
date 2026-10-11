import { api } from "./api";

export const clinicService = {
  // Optionally only clinics offering a given appointment type.
  getClinics: (serviceType) =>
    api(
      serviceType
        ? `/clinics?service=${encodeURIComponent(serviceType)}`
        : "/clinics",
    ).then((d) => d.clinics),

  getVetsByClinic: (clinicId) =>
    api(`/clinics/${encodeURIComponent(clinicId)}/vets`).then((d) => d.vets),
};

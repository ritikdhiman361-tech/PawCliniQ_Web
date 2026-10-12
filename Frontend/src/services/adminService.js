import { api } from "./api";

// Admin panel: clinics, their vets and clinic-staff logins.
export const adminService = {
  getClinics: () => api("/admin/clinics").then((d) => d.clinics),

  createClinic: (clinic) => api("/admin/clinics", { method: "POST", body: clinic }),

  updateClinic: (id, clinic) =>
    api(`/admin/clinics/${encodeURIComponent(id)}`, { method: "PUT", body: clinic }),

  createVet: (clinicId, vet) =>
    api(`/admin/clinics/${encodeURIComponent(clinicId)}/vets`, { method: "POST", body: vet }),

  updateVet: (id, vet) =>
    api(`/admin/vets/${encodeURIComponent(id)}`, { method: "PUT", body: vet }),

  createStaff: (clinicId, staff) =>
    api(`/admin/clinics/${encodeURIComponent(clinicId)}/staff`, { method: "POST", body: staff }),

  deleteStaff: (id) => api(`/admin/staff/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

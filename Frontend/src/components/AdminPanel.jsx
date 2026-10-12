import { useCallback, useEffect, useState } from "react";
import { APPOINTMENT_TYPES } from "../data/mockData";
import { adminService } from "../services/adminService";
import FormMessage from "./FormMessage";

// One page for everything the admin manages: clinics (details, hours,
// services, home visits), their vets, and the clinic-staff logins.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SLOT_LENGTHS = [10, 15, 20, 30, 45, 60];

const field =
  "w-full rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-600 focus:bg-white";
const labelClass = "block text-xs font-medium uppercase tracking-wide text-amber-700 mb-1";
const primaryBtn =
  "rounded-xl bg-linear-to-br from-amber-600 to-amber-800 px-5 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(180,83,9,0.3)] disabled:opacity-50";
const secondaryBtn =
  "rounded-xl border-2 border-amber-700 px-4 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50";
const card =
  "bg-white rounded-2xl border border-amber-200 p-5 sm:p-6 shadow-[0_2px_12px_rgba(120,53,15,0.07)]";

const EMPTY_CLINIC = {
  name: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  services: ["checkup"],
  openDays: [1, 2, 3, 4, 5, 6],
  openTime: "09:00",
  closeTime: "19:00",
  slotMinutes: 30,
  homeVisits: false,
  active: true,
};

const EMPTY_VET = {
  name: "",
  specialty: "",
  experience: 1,
  workingDays: [1, 2, 3, 4, 5, 6],
  startTime: null,
  endTime: null,
  active: true,
};

const is24Hours = (c) => c.openTime === "00:00" && c.closeTime === "24:00";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-amber-700"
      />
      {children}
    </label>
  );
}

function DaysPicker({ value, onChange }) {
  const toggle = (day) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEEK_ORDER.map((day) => {
        const on = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(day)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              on
                ? "bg-amber-600 border-amber-700 text-white"
                : "border-stone-300 text-stone-500"
            }`}
          >
            {on && "✓ "}
            {WEEKDAYS[day]}
          </button>
        );
      })}
    </div>
  );
}

// Strips server-only fields so the form state is exactly what the API takes.
const clinicFields = (c) =>
  Object.fromEntries(Object.keys(EMPTY_CLINIC).map((k) => [k, c[k]]));
const vetFields = (v) => Object.fromEntries(Object.keys(EMPTY_VET).map((k) => [k, v[k]]));

function ClinicForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => clinicFields(initial));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const input = (key) => ({
    value: form[key],
    onChange: (e) => set(key)(e.target.value),
    className: field,
  });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (value) =>
    set("services")(
      form.services.includes(value)
        ? form.services.filter((s) => s !== value)
        : [...form.services, value],
    );

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Clinic name">
        <input {...input("name")} required />
      </Field>
      <Field label="Area, city">
        <input {...input("location")} placeholder="Koramangala, Bengaluru" required />
      </Field>
      <Field label="Full address" className="sm:col-span-2">
        <input {...input("address")} required />
      </Field>
      <Field label="Phone">
        <input {...input("phone")} required />
      </Field>
      <Field label="Email">
        <input {...input("email")} type="email" required />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea {...input("description")} rows="2" maxLength={500} />
      </Field>

      <div className="sm:col-span-2">
        <span className={labelClass}>Services</span>
        <div className="flex flex-wrap gap-4">
          {APPOINTMENT_TYPES.map((t) => (
            <Toggle
              key={t.value}
              checked={form.services.includes(t.value)}
              onChange={() => toggleService(t.value)}
            >
              {t.label}
            </Toggle>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <span className={labelClass}>Open days</span>
        <DaysPicker value={form.openDays} onChange={set("openDays")} />
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-end gap-4">
        <Toggle
          checked={is24Hours(form)}
          onChange={(on) =>
            setForm((f) => ({
              ...f,
              openTime: on ? "00:00" : "09:00",
              closeTime: on ? "24:00" : "19:00",
            }))
          }
        >
          Open 24 hours
        </Toggle>
        {!is24Hours(form) && (
          <>
            <Field label="Opens">
              <input type="time" {...input("openTime")} required />
            </Field>
            <Field label="Closes">
              <input type="time" {...input("closeTime")} required />
            </Field>
          </>
        )}
        <Field label="Slot length">
          <select
            value={form.slotMinutes}
            onChange={(e) => set("slotMinutes")(Number(e.target.value))}
            className={field}
          >
            {SLOT_LENGTHS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="sm:col-span-2 flex flex-wrap gap-6">
        <Toggle checked={form.homeVisits} onChange={set("homeVisits")}>
          Offers home visits
        </Toggle>
        <Toggle checked={form.active} onChange={set("active")}>
          Active (shown to pet owners)
        </Toggle>
      </div>

      <FormMessage message={error} className="sm:col-span-2" />

      <div className="sm:col-span-2 flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : "Save clinic"}
        </button>
      </div>
    </form>
  );
}

function VetForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => vetFields(initial));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const ownShift = form.startTime !== null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
      <Field label="Name">
        <input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder="Dr. …"
          className={field}
          required
        />
      </Field>
      <Field label="Specialty">
        <input
          value={form.specialty}
          onChange={(e) => set("specialty")(e.target.value)}
          className={field}
          required
        />
      </Field>
      <Field label="Experience (years)">
        <input
          type="number"
          min="0"
          max="60"
          value={form.experience}
          onChange={(e) => set("experience")(Number(e.target.value))}
          className={field}
          required
        />
      </Field>
      <div className="sm:col-span-3">
        <span className={labelClass}>Working days</span>
        <DaysPicker value={form.workingDays} onChange={set("workingDays")} />
      </div>
      <div className="sm:col-span-3 flex flex-wrap items-end gap-4">
        <Toggle
          checked={!ownShift}
          onChange={(same) =>
            setForm((f) => ({
              ...f,
              startTime: same ? null : "09:00",
              endTime: same ? null : "17:00",
            }))
          }
        >
          Same hours as the clinic
        </Toggle>
        {ownShift && (
          <>
            <Field label="Shift starts">
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime")(e.target.value)}
                className={field}
                required
              />
            </Field>
            <Field label="Shift ends">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime")(e.target.value)}
                className={field}
                required
              />
            </Field>
            <span className="text-xs text-stone-500 pb-2">
              An end before the start is an overnight shift.
            </span>
          </>
        )}
        <Toggle checked={form.active} onChange={set("active")}>
          Active
        </Toggle>
      </div>
      <FormMessage message={error} className="sm:col-span-3" />
      <div className="sm:col-span-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryBtn}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : "Save vet"}
        </button>
      </div>
    </form>
  );
}

function StaffForm({ onSave }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4 items-end">
      <Field label="Name">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Front desk"
          className={field}
          required
        />
      </Field>
      <Field label="Login email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={field}
          required
        />
      </Field>
      <Field label="Password (8+ characters)">
        <input
          type="text"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          autoComplete="new-password"
          className={field}
          required
        />
      </Field>
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving ? "Adding…" : "Add login"}
      </button>
      <FormMessage message={error} className="sm:col-span-4" />
    </form>
  );
}

function AdminPanel() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null); // "new" = add clinic
  const [editingVet, setEditingVet] = useState(null); // vet id, or "new"
  const [notice, setNotice] = useState("");

  const reload = useCallback(
    () =>
      adminService
        .getClinics()
        .then((list) => {
          setClinics(list);
          setSelectedId((id) => id ?? list[0]?.id ?? "new");
        })
        .catch((err) => setError(err.message || "Unable to load clinics."))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const clinic = clinics.find((c) => c.id === selectedId);

  const done = async (message) => {
    setNotice(message);
    setEditingVet(null);
    await reload();
    setTimeout(() => setNotice(""), 3000);
  };

  const select = (id) => {
    setSelectedId(id);
    setEditingVet(null);
    setNotice("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-12 font-sans">
      <h1 className="text-2xl sm:text-3xl font-semibold text-amber-900 mb-1">Admin Panel</h1>
      <p className="text-sm text-amber-700 mb-6">
        Manage clinics, their vets and the logins clinics use to see their appointments.
      </p>

      <FormMessage message={error} className="mb-4" />
      {loading && <p className="text-sm text-amber-700">Loading…</p>}

      {!loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {clinics.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.id)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium ${
                c.id === selectedId
                  ? "border-amber-700 bg-amber-600 text-white"
                  : "border-amber-300 text-amber-800 hover:border-amber-500"
              } ${c.active ? "" : "opacity-60 line-through"}`}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => select("new")}
            className={`rounded-full border-2 border-dashed px-4 py-1.5 text-sm font-medium ${
              selectedId === "new" ? "border-amber-700 text-amber-900" : "border-amber-400 text-amber-700"
            }`}
          >
            + Add clinic
          </button>
        </div>
      )}

      {notice && (
        <p className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          ✓ {notice}
        </p>
      )}

      {selectedId === "new" && (
        <section className={card}>
          <h2 className="text-lg font-semibold text-amber-900 mb-4">New clinic</h2>
          <ClinicForm
            initial={EMPTY_CLINIC}
            onSave={async (form) => {
              const { id } = await adminService.createClinic(form);
              setSelectedId(id);
              await done("Clinic added. Now add its vets and a login.");
            }}
          />
        </section>
      )}

      {clinic && (
        <div className="grid gap-6">
          <section className={card}>
            <h2 className="text-lg font-semibold text-amber-900 mb-4">Clinic details</h2>
            <ClinicForm
              key={clinic.id}
              initial={clinic}
              onSave={async (form) => {
                await adminService.updateClinic(clinic.id, form);
                await done("Clinic saved.");
              }}
            />
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-amber-900">Vets</h2>
              {editingVet !== "new" && (
                <button type="button" onClick={() => setEditingVet("new")} className={secondaryBtn}>
                  + Add vet
                </button>
              )}
            </div>

            {editingVet === "new" && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <VetForm
                  initial={EMPTY_VET}
                  onCancel={() => setEditingVet(null)}
                  onSave={async (form) => {
                    await adminService.createVet(clinic.id, form);
                    await done("Vet added.");
                  }}
                />
              </div>
            )}

            {clinic.vets.length === 0 && editingVet !== "new" && (
              <p className="text-sm text-stone-500">No vets yet.</p>
            )}

            <div className="grid gap-3">
              {clinic.vets.map((vet) =>
                editingVet === vet.id ? (
                  <div key={vet.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                    <VetForm
                      initial={vet}
                      onCancel={() => setEditingVet(null)}
                      onSave={async (form) => {
                        await adminService.updateVet(vet.id, form);
                        await done("Vet saved.");
                      }}
                    />
                  </div>
                ) : (
                  <div
                    key={vet.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 px-4 py-3 ${
                      vet.active ? "" : "opacity-60"
                    }`}
                  >
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">
                        {vet.name} {!vet.active && <span className="text-xs">(inactive)</span>}
                      </p>
                      <p className="text-stone-600">
                        {vet.specialty} ·{" "}
                        {WEEK_ORDER.filter((d) => vet.workingDays.includes(d))
                          .map((d) => WEEKDAYS[d])
                          .join(", ")}{" "}
                        · {vet.startTime ? `${vet.startTime}–${vet.endTime}` : "clinic hours"}
                      </p>
                    </div>
                    <button type="button" onClick={() => setEditingVet(vet.id)} className={secondaryBtn}>
                      Edit
                    </button>
                  </div>
                ),
              )}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold text-amber-900 mb-1">Clinic logins</h2>
            <p className="text-sm text-stone-600 mb-4">
              Staff log in at the normal login page and see only this clinic's appointments.
            </p>
            <div className="grid gap-2 mb-5">
              {clinic.staff.length === 0 && (
                <p className="text-sm text-stone-500">No logins yet.</p>
              )}
              {clinic.staff.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 px-4 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium text-amber-900">{s.name}</span> · {s.email}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await adminService.deleteStaff(s.id);
                        await done("Login removed.");
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                    className="text-xs font-medium text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <StaffForm
              onSave={async (form) => {
                await adminService.createStaff(clinic.id, form);
                await done(`Login created for ${form.email}.`);
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;

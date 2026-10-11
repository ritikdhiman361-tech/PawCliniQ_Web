import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BREEDS_BY_TYPE, PET_TYPES } from "../data/mockData";
import { useAuth } from "../context/useAuth";
import FormMessage from "./FormMessage";
import Spinner from "./Spinner";

const petTypeOptions = PET_TYPES;
const breedOptionsByPetType = BREEDS_BY_TYPE;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignup = (form) => {
  if (form.name.trim().length < 2) return "Please enter your full name.";
  if (!/^\d{10}$/.test(form.mobile.trim()))
    return "Please enter a valid 10-digit mobile number.";
  if (!EMAIL_PATTERN.test(form.email.trim()))
    return "Please enter a valid email address.";
  if (form.password.length < 6)
    return "Password must be at least 6 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  if (!form.petName.trim()) return "Please enter your pet's name.";
  if (!form.petType) return "Please select your pet's type.";
  if (!form.petBreed.trim()) return "Please select your pet's breed.";
  return "";
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Where to go after logging in — the protected page that sent them here.
  const redirectTo = location.state?.from || "/";

  const finish = (message) => {
    setSuccess(message);
    setTimeout(() => navigate(redirectTo, { replace: true }), 700);
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  // ----- Login form state -----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!EMAIL_PATTERN.test(email.trim()))
      return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");

    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      finish(`Welcome back, ${loggedIn.name.split(" ")[0]}! Redirecting…`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  // ----- Sign up form state -----
  const [signupForm, setSignupForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    petName: "",
    petType: "",
    petBreed: "",
  });

  const handleSignupChange = (field) => (e) => {
    setSignupForm({ ...signupForm, [field]: e.target.value });
    setError("");
  };

  // Changing pet type clears whatever breed was picked, since it
  // likely doesn't belong to the new type.
  const handlePetTypeChange = (e) =>
    setSignupForm({ ...signupForm, petType: e.target.value, petBreed: "" });

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateSignup(signupForm);
    if (validationError) return setError(validationError);

    setError("");
    setSubmitting(true);
    try {
      const created = await signup({
        name: signupForm.name,
        mobile: signupForm.mobile.trim(),
        email: signupForm.email,
        password: signupForm.password,
        pet: {
          name: signupForm.petName,
          species: signupForm.petType,
          breed: signupForm.petBreed.trim(),
        },
      });
      finish(`Account created — welcome, ${created.name.split(" ")[0]}!`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  // Already logged in: skip this page. (While submitting/showing the success
  // message, `finish` handles the redirect itself.)
  if (user && !submitting && !success) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10 overflow-hidden">
      {/* Ambient floating accents */}
      <div
        className="blob w-80 h-80 -top-16 -left-16 bg-amber-300/25"
        style={{ animation: "blobFloat 15s ease-in-out infinite" }}
      />
      <div
        className="blob w-72 h-72 -bottom-20 -right-10 bg-blue-300/25"
        style={{ animation: "blobFloatReverse 18s ease-in-out infinite" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="relative w-full max-w-md bg-white p-8 rounded-2xl shadow-xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-heading`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold text-yellow-900 text-center mb-2">
              {mode === "login" ? "Login" : "Sign Up"}
            </h1>
            <p className="text-center text-sm text-gray-500 mb-6">
              {mode === "login"
                ? "Welcome back! Please log in to continue."
                : "Create an account for you and your pet."}
            </p>
          </motion.div>
        </AnimatePresence>

        <FormMessage message={error} className="mb-4" />
        <FormMessage message={success} tone="success" className="mb-4" />

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login-form"
              onSubmit={handleLoginSubmit}
              noValidate
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                className={inputClass}
                required
              />

              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                className={inputClass}
                required
              />

              <motion.button
                type="submit"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 28px rgba(120,53,15,0.35)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 18 }}
                disabled={submitting}
                className="w-full bg-yellow-900 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-yellow-900"
              >
                {submitting && <Spinner />}
                {submitting ? "Logging in…" : "Login"}
              </motion.button>

              <p className="text-center text-xs text-gray-400">
                Demo account: demo@pawcliniq.in / demo123
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="signup-form"
              onSubmit={handleSignupSubmit}
              noValidate
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={signupForm.name}
                onChange={handleSignupChange("name")}
                className={inputClass}
                required
              />

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Mobile Number"
                value={signupForm.mobile}
                onChange={handleSignupChange("mobile")}
                className={inputClass}
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={signupForm.email}
                onChange={handleSignupChange("email")}
                className={inputClass}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={signupForm.password}
                  onChange={handleSignupChange("password")}
                  className={inputClass}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange("confirmPassword")}
                  className={inputClass}
                  required
                />
              </div>

              <div className="border-t border-gray-200 pt-4 mt-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Pet details
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Pet's Name"
                    value={signupForm.petName}
                    onChange={handleSignupChange("petName")}
                    className={inputClass}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={signupForm.petType}
                      onChange={handlePetTypeChange}
                      className={inputClass}
                      required
                    >
                      <option value="" disabled>
                        Pet's Type
                      </option>
                      {petTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    {signupForm.petType && signupForm.petType !== "Other" ? (
                      <select
                        value={signupForm.petBreed}
                        onChange={handleSignupChange("petBreed")}
                        className={inputClass}
                        required
                      >
                        <option value="" disabled>
                          Select breed
                        </option>
                        {(breedOptionsByPetType[signupForm.petType] || []).map(
                          (breed) => (
                            <option key={breed} value={breed}>
                              {breed}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={
                          signupForm.petType === "Other"
                            ? "Pet's Breed"
                            : "Select pet type first"
                        }
                        value={signupForm.petBreed}
                        onChange={handleSignupChange("petBreed")}
                        className={inputClass}
                        disabled={!signupForm.petType}
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 10px 28px rgba(120,53,15,0.35)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 18 }}
                disabled={submitting}
                className="w-full bg-yellow-900 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-yellow-900"
              >
                {submitting && <Spinner />}
                {submitting ? "Creating account…" : "Create Account"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-gray-600 mt-6">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <motion.button
                type="button"
                onClick={() => switchMode("signup")}
                whileHover={{ x: 3 }}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign up
              </motion.button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <motion.button
                type="button"
                onClick={() => switchMode("login")}
                whileHover={{ x: 3 }}
                className="text-blue-600 font-medium hover:underline"
              >
                Log in
              </motion.button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default Login;

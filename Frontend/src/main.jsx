import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";

// Nothing is kept in browser storage; all data lives on the server. Clear
// what earlier versions left behind (the prototype's accounts with
// plain-text passwords, pets, bookings, and the booking draft).
try {
  for (const key of ["registeredUsers", "currentUser", "pets", "bookings", "isLoggedIn", "currentUserEmail"]) {
    localStorage.removeItem(key);
  }
  sessionStorage.removeItem("bookingDraft");
} catch {
  // Storage blocked — nothing to clean.
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
);

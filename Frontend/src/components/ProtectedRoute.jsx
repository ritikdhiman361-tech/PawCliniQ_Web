import { Navigate, useLocation } from "react-router-dom";
import { useIsPresent } from "framer-motion";
import { useAuth } from "../context/useAuth";

// `role` limits a page to one kind of account (e.g. "admin"); others go home.
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();
  // False while this page plays its exit animation (e.g. right after logout
  // navigated away) — redirecting then would override that navigation.
  const isPresent = useIsPresent();

  if (!user) {
    if (!isPresent) return null;
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;

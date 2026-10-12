import { Navigate, useLocation } from "react-router-dom";
import { useIsPresent } from "framer-motion";
import { homeFor, useAuth } from "../context/useAuth";

// `roles` limits a page to some kinds of account (e.g. ["admin"]); anyone
// else is sent to their own home page.
function ProtectedRoute({ children, roles }) {
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

  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;

  return children;
}

export default ProtectedRoute;

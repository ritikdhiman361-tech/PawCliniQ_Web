import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { SESSION_EXPIRED } from "../services/api";
import { authService } from "../services/authService";
import PageLoader from "../components/PageLoader";
import { AuthContext } from "./useAuth";

// Holds the logged-in user in React state so the navbar, protected routes and
// pages all re-render together on login/logout.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until the server has said whether the session cookie is valid.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Any API call answered with 401 means the session ended (expired, or
  // logged out in another tab).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED, onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const signup = useCallback(async (details) => {
    const created = await authService.signup(details);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    // Clear locally right away; the server call just expires the cookie.
    authService.logout().catch(() => {});
    // Same priority as router navigation, so a "logout then navigate" in one
    // handler renders as a single update instead of first showing the
    // protected page logged-out (which would bounce to /login).
    startTransition(() => setUser(null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      isClinic: user?.role === "clinic",
      login,
      signup,
      logout,
    }),
    [user, login, signup, logout],
  );

  if (checking) return <PageLoader />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

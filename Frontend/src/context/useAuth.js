import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Where each kind of account starts: clinic staff and admins have their own
// pages; pet owners (and visitors) the home page.
export const homeFor = (user) =>
  ({ clinic: "/clinic", admin: "/admin" })[user?.role] || "/";

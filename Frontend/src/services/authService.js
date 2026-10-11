import { api } from "./api";

export const authService = {
  // The logged-in user from the session cookie, or null.
  getCurrentUser: () => api("/auth/me").then((d) => d.user),

  login: (email, password) =>
    api("/auth/login", { method: "POST", body: { email, password } }).then(
      (d) => d.user,
    ),

  // Creates the account and its first pet profile.
  signup: ({ name, mobile, email, password, pet }) =>
    api("/auth/signup", {
      method: "POST",
      body: { name, mobile, email, password, pet },
    }).then((d) => d.user),

  // keepalive: the UI logs out instantly and may navigate or reload right
  // away; without it the browser can abort the request and the session
  // cookie would survive.
  logout: () => api("/auth/logout", { method: "POST", keepalive: true }),
};

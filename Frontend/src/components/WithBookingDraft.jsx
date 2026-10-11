import { useEffect, useState } from "react";
import { bookingDraft } from "../services/bookingService";
import FormMessage from "./FormMessage";
import PageLoader from "./PageLoader";

// Loads the in-progress booking from the server, then renders
// children(draft). Pass `changes` to save them first (one request) — e.g. a
// clinic picked while browsing. Only the first render's `changes` are used.
function WithBookingDraft({ changes, children }) {
  const [initialChanges] = useState(changes);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const load = initialChanges
      ? bookingDraft.update(initialChanges)
      : bookingDraft.get();
    load
      .then((d) => active && setDraft(d))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [initialChanges, attempt]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <FormMessage message={error} />
        <button
          type="button"
          onClick={() => {
            setError("");
            setAttempt((n) => n + 1);
          }}
          className="text-sm font-medium text-amber-700 hover:text-amber-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!draft) return <PageLoader className="min-h-[60vh]" />;
  return children(draft);
}

export default WithBookingDraft;

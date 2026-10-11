// Small inline spinner for buttons in a loading state.
const Spinner = () => (
  <span
    aria-hidden="true"
    className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin align-[-2px] mr-2"
  />
);

export default Spinner;

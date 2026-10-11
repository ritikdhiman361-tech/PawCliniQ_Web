// Shared booking-flow styles (originally defined in Forms.jsx).

export const inputClass =
  "w-full border-2 border-amber-700 rounded-2xl px-5 py-3 text-[15px] bg-amber-50 text-stone-900 outline-none transition-all duration-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-200 focus:bg-white box-border";

export const primaryBtnClass =
  "bg-gradient-to-br from-amber-600 to-amber-800 text-white px-7 py-3 rounded-xl text-[15px] font-medium border-none cursor-pointer shadow-[0_2px_8px_rgba(180,83,9,0.3)] disabled:opacity-50 disabled:cursor-not-allowed";

export const selectStyles = {
  control: (base, state) => ({
    ...base,
    border: `2px solid ${state.isFocused ? "#d97706" : "#b45309"}`,
    borderRadius: "14px",
    padding: "4px 8px",
    backgroundColor: state.isFocused ? "#fff" : "#fffbeb",
    boxShadow: state.isFocused ? "0 0 0 3px #fde68a" : "none",
    transition: "all 0.2s",

    "&:hover": {
      borderColor: "#d97706",
      backgroundColor: "#fff",
    },
  }),

  placeholder: (base) => ({
    ...base,
    color: "#a16207",
    opacity: 0.7,
  }),

  singleValue: (base) => ({
    ...base,
    color: "#1c1917",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#d97706"
      : state.isFocused
        ? "#fef3c7"
        : "white",

    color: state.isSelected ? "white" : "#1c1917",
    cursor: "pointer",
  }),

  menu: (base) => ({
    ...base,
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #fde68a",
  }),
};

// Header pill + back link used across the booking steps.
export const stepPillClass =
  "bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-3.5 py-1 text-xs font-medium inline-block mb-3";

export const backLinkClass =
  "text-sm text-amber-700 hover:text-amber-900 font-medium mb-6";

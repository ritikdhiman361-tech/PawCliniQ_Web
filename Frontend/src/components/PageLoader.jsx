// Full-height spinner shown while a page waits for the server.
const PageLoader = ({ className = "min-h-screen" }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`${className} flex items-center justify-center`}
  >
    <span className="w-8 h-8 border-[3px] border-amber-200 border-t-amber-700 rounded-full animate-spin" />
  </div>
);

export default PageLoader;

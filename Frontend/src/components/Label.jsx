const Label = ({ icon, children, htmlFor }) => {
  const Tag = htmlFor ? "label" : "div";
  return (
    <Tag
      htmlFor={htmlFor}
      className="block text-xs font-medium text-amber-700 uppercase tracking-wide mb-1.5"
    >
      {icon && <span className="mr-1">{icon}</span>}

      {children}
    </Tag>
  );
};

export default Label;

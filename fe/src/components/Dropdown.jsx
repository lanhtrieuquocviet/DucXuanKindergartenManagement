import { useState } from "react";

function Dropdown({ title, children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="dropdown">
      <div
        className="dropdown-header"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className="arrow">{open ? "▾" : "▸"}</span>
      </div>

      {open && <ul className="dropdown-body">{children}</ul>}
    </div>
  );
}

export default Dropdown;

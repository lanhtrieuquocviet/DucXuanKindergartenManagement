import { useState } from "react";

function Dropdown({ title, children, color }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="dropdown">
      <div
        className={`dropdown-header ${color}`}
        onClick={() => setOpen(!open)}
      >
        {title}
        <span>{open ? "▾" : "▸"}</span>
      </div>

      {open && <ul className="dropdown-body">{children}</ul>}
    </div>
  );
}
export default Dropdown;
"use client";
import { sx } from "../ui";

export default function Dropdown({ label, open, onToggle, options, buttonStyle, panelStyle, arrowColor = "#201C16" }) {
  return (
    <div style={{ position: "relative" }}>
      <button onClick={onToggle} style={sx(buttonStyle)}>
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={arrowColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div style={sx(panelStyle)}>
          {options.map((op, i) => (
            <div key={i} onClick={op.onSelect} style={sx(op.optionStyle)}>{op.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { sx, Hoverable } from "../../ui";

/** The pill the console uses for every status, type and count label. */
export function Badge({ bg, fg, children, style }) {
  return (
    <span style={sx(`background:${bg};color:${fg};font-weight:800;font-size:11px;padding:3px 10px;border-radius:100px;${style || ""}`)}>
      {children}
    </span>
  );
}

/** One white panel: the console's only surface for lists and charts. */
export function Panel({ children, style }) {
  return <div style={sx(`background:#fff;border-radius:16px;border:1px solid #e8e2d4;${style || ""}`)}>{children}</div>;
}

export function PanelHead({ children, action }) {
  return (
    <div style={sx("display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #efe9dc")}>
      <div style={sx("font-weight:800;font-size:15px")}>{children}</div>
      {action}
    </div>
  );
}

export function EmptyRow({ children, pad = "40px 20px" }) {
  return <div style={sx(`padding:${pad};text-align:center;color:#8a8378;font-size:14px`)}>{children}</div>;
}

/** A segmented-control button: selected reads as a raised white chip. */
export function Segment({ active, onClick, children }) {
  return (
    <Hoverable
      as="span"
      onClick={onClick}
      style={`padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;${active ? "background:#fff;color:#201C16;box-shadow:0 1px 3px rgba(0,0,0,0.12)" : "color:#6b655a"}`}
      hoverStyle={active ? undefined : "color:#201C16"}
    >
      {children}
    </Hoverable>
  );
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={sx("padding:14px 18px;border-bottom:1px solid #efe9dc")}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={sx("width:100%;max-width:340px;box-sizing:border-box;padding:10px 14px;border-radius:10px;border:1px solid #e2dccf;font-size:14px;background:#FBF9F4")}
      />
    </div>
  );
}

/** An account's uploaded photo, or its initial in a circle while it has none. */
export function Avatar({ color, initial, src, size = 34 }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%", flex: "none", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: Math.round(size * 0.37),
        background: src ? `center/cover no-repeat url(${src})` : color,
      }}
    >
      {!src && initial}
    </div>
  );
}

/** The one-line strip a table shows while it is refetching. */
export function LoadingNote({ children = "กำลังโหลด..." }) {
  return <div style={sx("padding:10px 18px;font-size:12px;color:#8a8378;border-bottom:1px solid #f3efe6")}>{children}</div>;
}

export function ErrorNote({ children }) {
  return <div style={sx("padding:12px 18px;font-size:13px;color:#B8321F;background:#FDEDEA;border-bottom:1px solid #f3efe6")}>{children}</div>;
}

/** A post's picture, falling back to its palette colour while none is set. */
export function PostThumb({ src, bg, size = 44, radius = 10 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flex: "none", background: src ? `center/cover no-repeat url(${src})` : bg }} />
  );
}

export function DangerButton({ onClick, children, style }) {
  return (
    <Hoverable
      as="button"
      onClick={onClick}
      style={`background:#E3402B;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;${style || ""}`}
      hoverStyle="background:#C9331F"
    >
      {children}
    </Hoverable>
  );
}

export function DarkButton({ onClick, children, style }) {
  return (
    <Hoverable
      as="button"
      onClick={onClick}
      style={`background:#201C16;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;${style || ""}`}
      hoverStyle="background:#3a342a"
    >
      {children}
    </Hoverable>
  );
}

export function GhostButton({ onClick, children, style }) {
  return (
    <Hoverable
      as="button"
      onClick={onClick}
      style={`background:#fff;color:#201C16;border:1px solid #d9d3c6;border-radius:10px;padding:11px 18px;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;${style || ""}`}
      hoverStyle="background:#F5F1E8"
    >
      {children}
    </Hoverable>
  );
}

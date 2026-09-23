"use client";
import { useState } from "react";

export const LOGO = "/assets/petory-dog-logo.png";
export const DOG1 = "/uploads/dog-nobg.png";
export const DOG2 = "/uploads/dog2-nobg.png";
export const AVATAR = "/uploads/profile-avatar.webp";

// Turns a plain CSS text string ("color:red;font-weight:800") into a React style object.
export function sx(css) {
  if (!css) return undefined;
  const style = {};
  css.split(";").forEach((decl) => {
    const i = decl.indexOf(":");
    if (i === -1) return;
    const rawKey = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!rawKey || !value) return;
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[key] = value;
  });
  return style;
}

/**
 * React drops a style key it no longer renders by assigning "" to it. For a
 * longhand that lives inside a shorthand — `backgroundColor` inside an
 * unchanged `background` — that also wipes the shorthand's colour, so a button
 * whose hover state uses `background-color` turned white for good once the
 * pointer left. Restating the base colour under the same longhand key keeps the
 * key set identical across renders, so only the value flips.
 */
function stableBase(style, overlays) {
  const base = sx(style) ?? {};
  const needsLonghand = base.background !== undefined && base.backgroundColor === undefined
    && overlays.some((overlay) => overlay && sx(overlay)?.backgroundColor !== undefined);
  return needsLonghand ? { ...base, backgroundColor: base.background } : base;
}

// Generic wrapper implementing the design's style-hover / style-active states.
export function Hoverable({ as: Tag = "div", style, hoverStyle, activeStyle, children, ...rest }) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const merged = {
    ...stableBase(style, [hoverStyle, activeStyle]),
    ...(hover && hoverStyle ? sx(hoverStyle) : null),
    ...(active && activeStyle ? sx(activeStyle) : null),
  };
  return (
    <Tag
      style={merged}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Stand-in for the design's drag & drop photo uploader.
export function ImageSlot({ shape = "rect", placeholder, src, style }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: src ? `center/cover no-repeat url(${src})` : "#EFEAE2",
        borderRadius: shape === "circle" ? "50%" : 0,
        color: "#8a8378",
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
        overflow: "hidden",
        cursor: "pointer",
        ...sx(style),
      }}
    >
      {!src && placeholder}
    </div>
  );
}

"use client";
import { sx } from "../ui";
import { usePetory } from "../context";

export default function Toast() {
  const { state } = usePetory();
  if (!state.toast) return null;
  return (
    <div style={sx("position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#201C16;color:#fff;padding:14px 24px;border-radius:100px;font-weight:700;font-size:14px;z-index:200;animation:toastIn 0.25s ease-out")}>
      {state.toast}
    </div>
  );
}

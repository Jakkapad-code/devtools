"use client";
import { useEffect } from "react";
import { sx } from "../ui";
import { usePetory } from "../context";

const TYPE_LABELS = { like: "LIKE", comment: "COMMENT", match: "MATCH", message: "MESSAGE", interest: "INTEREST" };

export default function NotificationsPage() {
  const { state: s, update } = usePetory();

  useEffect(() => {
    update((s2) => ({ notifications: s2.notifications.map((n) => ({ ...n, read: true })) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={sx("max-width:700px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,3.8rem);text-transform:uppercase;margin:0 0 24px")}>Notifications</h1>
      <div style={sx("display:flex;flex-direction:column;gap:2px")}>
        {s.notifications.map((n) => (
          <div key={n.id} style={sx(`display:flex;align-items:center;gap:14px;padding:16px 8px;border-bottom:2px solid #201C16;background:${n.read ? "transparent" : "#F4C9D6"}`)}>
            <span style={sx("font-family:'Anton',sans-serif;font-size:11px;letter-spacing:0.04em;color:#E3402B;text-transform:uppercase;width:70px;flex:none")}>{TYPE_LABELS[n.type] || n.type.toUpperCase()}</span>
            <span style={sx("flex:1;font-size:14px")}>{n.text}</span>
            <span style={sx("font-size:12px;color:#8a8378;flex:none")}>{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

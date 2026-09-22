"use client";
import { useEffect, useState } from "react";
import { sx } from "../ui";
import { notificationClient } from "@/features/auth/client";

const TYPE_LABELS = { like: "LIKE", comment: "COMMENT", match: "MATCH", message: "MESSAGE", follow: "FOLLOW" };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    void Promise.all([notificationClient.list(), notificationClient.markAllRead()])
      .then(([payload]) => { if (active) setNotifications(payload.notifications.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); })
      .catch(() => { if (active) setNotifications([]); });
    return () => { active = false; };
  }, []);

  return <div style={sx("max-width:700px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}><h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,3.8rem);text-transform:uppercase;margin:0 0 24px")}>Notifications</h1><div style={sx("display:flex;flex-direction:column;gap:2px")}>{notifications.map((notification) => <div key={notification.id} style={sx("display:flex;align-items:center;gap:14px;padding:16px 8px;border-bottom:2px solid #201C16")}><span style={sx("font-family:'Anton',sans-serif;font-size:11px;letter-spacing:0.04em;color:#E3402B;text-transform:uppercase;width:70px;flex:none")}>{TYPE_LABELS[notification.type] || notification.type.toUpperCase()}</span><span style={sx("flex:1;font-size:14px")}>{notification.actorName || "Petory"} มีการแจ้งเตือนใหม่</span><span style={sx("font-size:12px;color:#8a8378;flex:none")}>ใหม่</span></div>)}</div></div>;
}

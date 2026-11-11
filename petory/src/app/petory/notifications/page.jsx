"use client";
import { useEffect, useState } from "react";
import { sx } from "../ui";
import { notificationClient } from "@/features/auth/client";

const TYPE_LABELS = { like: "LIKE", comment: "COMMENT", match: "MATCH", message: "MESSAGE", follow: "FOLLOW" };
const TYPE_MESSAGES = { comment: "แสดงความคิดเห็นในโพสต์ของคุณ", follow: "เริ่มติดตามคุณ" };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let active = true;
    void notificationClient.list()
      .then((payload) => { if (active) setNotifications(payload.notifications); })
      .catch(() => { if (active) setError("โหลดการแจ้งเตือนไม่สำเร็จ"); });
    return () => { active = false; };
  }, []);

  const markRead = async () => {
    setMarking(true);
    try {
      await notificationClient.markRead(notifications.filter((item) => !item.readAt).map((item) => item.id));
      const payload = await notificationClient.list();
      setNotifications(payload.notifications);
      setError("");
    } catch {
      setError("บันทึกสถานะการอ่านไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setMarking(false);
    }
  };

  return <div style={sx("max-width:700px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
    <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,3.8rem);text-transform:uppercase;margin:0 0 24px")}>Notifications</h1>
    {error && <p role="alert" style={sx("color:#B42318")}>{error}</p>}
    {notifications.some((item) => !item.readAt) && <button type="button" onClick={() => void markRead()} disabled={marking} style={sx("border:0;background:none;color:#E3402B;font-weight:700;cursor:pointer;margin-bottom:16px")}>{marking ? "กำลังบันทึก..." : "ทำเครื่องหมายว่าอ่านทั้งหมด"}</button>}
    <div style={sx("display:flex;flex-direction:column;gap:2px")}>
      {notifications.map((notification) => <div key={notification.id} style={sx("display:flex;align-items:center;gap:14px;padding:16px 8px;border-bottom:2px solid #201C16")}>
        <span style={sx("font-family:'Anton',sans-serif;font-size:11px;letter-spacing:0.04em;color:#E3402B;text-transform:uppercase;width:70px;flex:none")}>{TYPE_LABELS[notification.type] || notification.type.toUpperCase()}</span>
        <span style={sx("flex:1;font-size:14px")}>{notification.actorName || "Petory"} {TYPE_MESSAGES[notification.type] || "มีการแจ้งเตือนใหม่"}</span>
        <span style={sx("font-size:12px;color:#8a8378;flex:none")}>{notification.readAt ? "อ่านแล้ว" : "ใหม่"}</span>
      </div>)}
    </div>
  </div>;
}

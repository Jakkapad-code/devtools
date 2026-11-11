"use client";
import { sx } from "../ui";
import { usePetory } from "../context";

export default function SettingsPage() {
  const { openLogoutConfirm } = usePetory();
  return (
    <div style={sx("max-width:600px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(2.4rem,8vw,3.8rem);text-transform:uppercase;margin:0 0 24px")}>Settings</h1>
      <div style={sx("display:flex;flex-direction:column;gap:2px")}>
        {["Push Notifications", "Show My Distance", "Private Profile"].map((setting) => (
          <div key={setting} style={sx("display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 4px;border-bottom:2px solid #201C16")}>
            <span style={sx("font-weight:700")}>{setting}</span>
            <span style={sx("font-size:13px;color:#665F54")}>{setting === "Show My Distance" ? "จัดการการแชร์ตำแหน่งได้ที่หน้า Matching" : "ยังไม่รองรับ"}</span>
          </div>
        ))}
      </div>
      <button onClick={openLogoutConfirm} style={sx("margin-top:28px;width:100%;border:2px solid #E3402B;color:#E3402B;background:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:15px;border-radius:100px;cursor:pointer")}>Log Out</button>
    </div>
  );
}

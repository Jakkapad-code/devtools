"use client";
import { sx } from "../ui";

export default function MessagesIndexPage() {
  return (
    <div style={sx("flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:40px;text-align:center")}>
      <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.4rem,4vw,1.8rem);text-transform:uppercase;color:#8a8378")}>Select A Conversation</div>
      <p style={sx("color:#8a8378;font-size:14px;margin:0")}>เลือกการสนทนาทางซ้ายเพื่อเริ่มแชท</p>
    </div>
  );
}

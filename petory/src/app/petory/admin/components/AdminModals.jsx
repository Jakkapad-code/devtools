"use client";
import { sx, Hoverable } from "../../ui";
import ModalShell from "../../components/ModalShell";
import { SUSPEND_DURATIONS, SUSPEND_REASONS } from "../constants";
import { useAdmin } from "../context";
import { DangerButton, DarkButton, GhostButton } from "./AdminUI";

export default function AdminModals() {
  const a = useAdmin();
  const { modal } = a.ui;

  if (modal === "suspend") {
    return (
      <ModalShell maxWidth={460}>
        <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 6px")}>ระงับบัญชีผู้ใช้</h2>
        <p style={sx("font-size:14px;color:#4a453c;margin:0 0 20px")}>
          {a.suspendTargetName} จะไม่สามารถเข้าสู่ระบบ และโพสต์ทั้งหมดจะถูกซ่อนจากฟีด
        </p>

        <div style={sx("font-size:12px;font-weight:700;color:#6b655a;margin-bottom:8px")}>ระยะเวลา</div>
        <div style={sx("display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px")}>
          {SUSPEND_DURATIONS.map(([key, label]) => {
            const on = a.ui.suspendDuration === key;
            return (
              <span
                key={key}
                onClick={() => a.setSuspendDuration(key)}
                style={sx(`padding:7px 14px;border-radius:100px;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;flex:none;border:1px solid ${on ? "#201C16;background:#201C16;color:#fff" : "#d9d3c6;background:#fff;color:#201C16"}`)}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div style={sx("font-size:12px;font-weight:700;color:#6b655a;margin-bottom:8px")}>เหตุผล</div>
        <div style={sx("display:flex;flex-direction:column;gap:6px;margin-bottom:22px")}>
          {SUSPEND_REASONS.map((reason) => {
            const on = a.ui.suspendReason === reason;
            return (
              <div
                key={reason}
                onClick={() => a.setSuspendReason(reason)}
                style={sx(`padding:11px 14px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:1px solid ${on ? "#201C16;background:#F5F1E8" : "#ece7db;background:#fff"}`)}
              >
                {reason}
              </div>
            );
          })}
        </div>

        <div style={sx("display:flex;gap:12px")}>
          <DarkButton onClick={a.confirmSuspend} style="flex:1;padding:14px;border-radius:100px;font-size:14px">ยืนยันการระงับ</DarkButton>
          <GhostButton onClick={a.closeModal} style="padding:14px 20px;border-radius:100px;font-size:14px">ยกเลิก</GhostButton>
        </div>
      </ModalShell>
    );
  }

  if (modal === "deletePost") {
    return (
      <ModalShell maxWidth={440}>
        <h2 style={sx("font-family:'Anton',sans-serif;font-size:22px;text-transform:uppercase;margin:0 0 6px")}>ลบโพสต์ที่ไม่เหมาะสม</h2>
        <p style={sx("font-size:14px;color:#4a453c;margin:0 0 14px")}>
          โพสต์ของ {a.deleteTargetAuthor} จะถูกลบถาวร และเจ้าของจะได้รับแจ้งเตือน
        </p>
        <div style={sx("background:#F5F1E8;border-radius:12px;padding:12px 14px;font-size:13px;line-height:1.5;margin-bottom:22px")}>
          “{a.deleteTarget?.caption || ""}”
        </div>
        <div style={sx("display:flex;gap:12px")}>
          <DangerButton onClick={a.confirmDeletePost} style="flex:1;padding:14px;border-radius:100px;font-size:14px">ลบโพสต์</DangerButton>
          <GhostButton onClick={a.closeModal} style="padding:14px 20px;border-radius:100px;font-size:14px">ยกเลิก</GhostButton>
        </div>
      </ModalShell>
    );
  }

  return null;
}

/** Kept beside the modals so the shell can reuse the same hover treatment. */
export function SidebarButton({ onClick, title, children, style, hoverStyle }) {
  return <Hoverable as="button" onClick={onClick} title={title} style={style} hoverStyle={hoverStyle}>{children}</Hoverable>;
}

import { sx } from "../ui";
import ModalShell from "./ModalShell";

export default function ConfirmModal({ title, body, confirmLabel, onConfirm, onCancel, danger = true }) {
  return (
    <ModalShell maxWidth={380} center>
      <h2 style={sx("font-family:'Anton',sans-serif;font-size:26px;text-transform:uppercase;margin:0 0 14px")}>{title}</h2>
      <p style={sx("font-size:14px;color:#4a453c;margin:0 0 24px")}>{body}</p>
      <div style={sx("display:flex;gap:12px")}>
        <button onClick={onConfirm} style={sx(`flex:1;background:${danger ? "#E3402B" : "#201C16"};color:#fff;font-weight:800;font-size:14px;text-transform:uppercase;padding:14px;border-radius:100px;border:none;cursor:pointer`)}>{confirmLabel}</button>
        <button onClick={onCancel} style={sx("border:2px solid #201C16;background:#fff;font-weight:700;font-size:14px;text-transform:uppercase;padding:14px 20px;border-radius:100px;cursor:pointer")}>Cancel</button>
      </div>
    </ModalShell>
  );
}

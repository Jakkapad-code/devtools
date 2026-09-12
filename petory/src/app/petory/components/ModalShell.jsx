import { sx } from "../ui";

export default function ModalShell({ children, maxWidth = 420, center = false }) {
  return (
    <div style={sx("position:fixed;inset:0;background:rgba(32,28,22,0.6);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px")}>
      <div style={{ background: "#fff", borderRadius: 24, border: "2px solid #201C16", maxWidth, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 28, textAlign: center ? "center" : undefined }}>
        {children}
      </div>
    </div>
  );
}

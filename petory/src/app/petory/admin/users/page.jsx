"use client";
import { useEffect } from "react";
import { sx, Hoverable } from "../../ui";
import { useAdmin } from "../context";
import { Avatar, Badge, EmptyRow, ErrorNote, LoadingNote, SearchBar } from "../components/AdminUI";

const COLUMNS = "minmax(0,1fr) 90px 100px 170px 140px";

export default function AdminUsersPage() {
  const a = useAdmin();
  const { loadUsers, ui } = a;

  useEffect(() => {
    const timer = setTimeout(() => { void loadUsers(ui.search); }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers, ui.search]);

  return (
    <div style={sx("background:#fff;border-radius:16px;border:1px solid #e8e2d4;overflow:hidden")}>
      <SearchBar value={ui.search} onChange={a.onSearch} placeholder="ค้นหาผู้ใช้..." />
      {a.error && <ErrorNote>{a.error}</ErrorNote>}
      {a.loading && <LoadingNote />}

      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, gap: 12, padding: "10px 18px", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color: "#a39c8e", borderBottom: "1px solid #efe9dc" }}>
        <span>ผู้ใช้</span><span>โพสต์</span><span>ถูกรายงาน</span><span>สถานะ</span><span />
      </div>

      {!a.loading && a.users.length === 0 && (
        <EmptyRow pad="60px 20px">{ui.search ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ยังไม่มีผู้ใช้อื่นในระบบ"}</EmptyRow>
      )}

      {a.users.map((user) => (
        <Hoverable
          key={user.id}
          style={`display:grid;grid-template-columns:${COLUMNS};gap:12px;align-items:center;padding:12px 18px;border-bottom:1px solid #f3efe6`}
          hoverStyle="background:#FBF9F4"
        >
          <div style={sx("display:flex;align-items:center;gap:12px;min-width:0")}>
            <Avatar color={user.color} initial={user.initial} src={user.avatarSrc} size={36} />
            <div style={sx("min-width:0")}>
              <div style={sx("font-weight:800;font-size:14px")}>
                {user.name}
                {user.role === "admin" && <Badge bg="#F0C93B" fg="#201C16" style="margin-left:8px">ADMIN</Badge>}
              </div>
              <div style={sx("font-size:12px;color:#8a8378")}>{user.location}</div>
            </div>
          </div>
          <span style={sx("font-size:13px")}>{user.postCount}</span>
          <span style={sx("font-size:13px")}>{user.reportCount} ครั้ง</span>
          <div style={sx("display:flex;flex-direction:column;gap:2px;align-items:flex-start")}>
            {user.isSuspended
              ? <Badge bg="#FDEDEA" fg="#B8321F">ถูกระงับ</Badge>
              : <Badge bg="#CFEEDB" fg="#1F5C3A">ใช้งานอยู่</Badge>}
            {user.isSuspended && <span style={sx("font-size:11px;color:#8a8378")}>{user.suspendNote}</span>}
          </div>
          <div style={sx("justify-self:end")}>
            {user.isSuspended ? (
              <Hoverable
                as="button"
                onClick={() => a.unsuspendUser(user.id)}
                style="background:#fff;color:#201C16;border:1px solid #d9d3c6;border-radius:10px;padding:8px 14px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap"
                hoverStyle="background:#F5F1E8"
              >
                ยกเลิกการระงับ
              </Hoverable>
            ) : user.role === "admin" ? (
              // An admin cannot be suspended from here; the API refuses it too.
              <span style={sx("font-size:12px;color:#a39c8e")}>—</span>
            ) : (
              <Hoverable
                as="button"
                onClick={() => a.openSuspend(user.id)}
                style="background:#201C16;color:#fff;border:none;border-radius:10px;padding:8px 14px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap"
                hoverStyle="background:#3a342a"
              >
                ระงับบัญชี
              </Hoverable>
            )}
          </div>
        </Hoverable>
      ))}
    </div>
  );
}

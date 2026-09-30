"use client";
import { useRouter } from "next/navigation";
import { sx, Hoverable } from "../ui";
import { useAdmin } from "./context";
import { Avatar, Badge, EmptyRow, Panel, PanelHead } from "./components/AdminUI";

function Kpi({ label, value, sub, hint, style, onClick }) {
  return (
    <Hoverable onClick={onClick} style={`${style};border-radius:16px;padding:16px;cursor:pointer;min-width:0`} hoverStyle="transform:translateY(-2px)">
      <div style={sx("display:flex;align-items:center;justify-content:space-between")}>
        <span style={sx("font-size:13px;font-weight:700;opacity:0.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0")}>{label}</span>
        {hint && <span style={sx("font-size:11px;font-weight:800;opacity:0.7")}>{hint}</span>}
      </div>
      <div style={sx("font-family:'Anton',sans-serif;font-size:34px;line-height:1;margin-top:12px")}>{value}</div>
      <div style={sx("font-size:12px;margin-top:8px;opacity:0.75")}>{sub}</div>
    </Hoverable>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const a = useAdmin();
  const { counts, overview } = a;

  const openReports = (filter) => { a.setReportFilter(filter); a.setReportType("all"); router.push("/petory/admin/reports"); };
  const openReport = (id) => { a.setReportFilter("pending"); a.setReportType("all"); a.selectReport(id); router.push("/petory/admin/reports"); };

  // The layout fetches the overview, so the first paint here has nothing yet.
  if (!overview) {
    return <Panel style="padding:60px 20px;text-align:center;color:#8a8378;font-size:14px">{a.error || "กำลังโหลดข้อมูล..."}</Panel>;
  }

  const { totals } = overview;

  return (
    <div style={sx("display:flex;flex-direction:column;gap:20px")}>
      <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px")}>
        <Kpi label="รายงานรอตรวจสอบ" value={counts.pending} sub="ต้องดำเนินการ" hint="ดู ›" style="background:#E3402B;color:#fff" onClick={() => openReports("pending")} />
        <Kpi label="ผู้ใช้ทั้งหมด" value={totals.accounts} sub={`${totals.suspended} บัญชีถูกระงับ`} style="background:#fff;color:#201C16;border:1px solid #e8e2d4" onClick={() => router.push("/petory/admin/users")} />
        <Kpi label="โพสต์ทั้งหมด" value={totals.posts} sub={`${totals.removedPosts} โพสต์ถูกลบ`} style="background:#fff;color:#201C16;border:1px solid #e8e2d4" onClick={() => router.push("/petory/admin/posts")} />
        <Kpi label="ดำเนินการแล้ว" value={counts.resolved + counts.dismissed} sub={`จากรายงาน ${a.totalReports} รายการ`} style="background:#201C16;color:#F5F1E8" onClick={() => openReports("resolved")} />
      </div>

      <div style={sx("display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;align-items:start")}>
        <div style={sx("display:flex;flex-direction:column;gap:20px;min-width:0")}>
          <Panel style="overflow:hidden">
            <PanelHead action={<span onClick={() => openReports("pending")} style={sx("font-size:13px;font-weight:700;color:#E3402B;cursor:pointer")}>ดูทั้งหมด ›</span>}>
              รายงานที่รอตรวจสอบ
            </PanelHead>
            {overview.pendingQueue.length === 0 && <EmptyRow>ไม่มีรายงานค้างอยู่</EmptyRow>}
            {overview.pendingQueue.map((r) => (
              <Hoverable
                key={r.id}
                onClick={() => openReport(r.id)}
                style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #f3efe6;cursor:pointer"
                hoverStyle="background:#FBF9F4"
              >
                <Avatar color={r.targetColor} initial={r.targetInitial} />
                <div style={sx("flex:1;min-width:0")}>
                  <div style={sx("font-weight:800;font-size:14px")}>{r.reasonTh}</div>
                  <div style={sx("font-size:12px;color:#6b655a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{r.typeLabel} · {r.targetName}</div>
                </div>
                <span style={sx("font-size:11px;color:#a39c8e;white-space:nowrap")}>{r.time}</span>
              </Hoverable>
            ))}
          </Panel>

          <Panel style="overflow:hidden">
            <PanelHead action={<span onClick={() => router.push("/petory/admin/users")} style={sx("font-size:13px;font-weight:700;color:#E3402B;cursor:pointer")}>จัดการผู้ใช้ ›</span>}>
              ผู้ใช้ที่ถูกรายงานบ่อย
            </PanelHead>
            {overview.topReportedUsers.length === 0 && <EmptyRow>ยังไม่มีผู้ใช้ที่ถูกรายงาน</EmptyRow>}
            {overview.topReportedUsers.map((u) => (
              <div key={u.id} style={sx("display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #f3efe6")}>
                <Avatar color={u.color} initial={u.initial} src={u.avatarSrc} />
                <div style={sx("flex:1;min-width:0")}>
                  <div style={sx("font-weight:800;font-size:14px")}>{u.name}</div>
                  <div style={sx("font-size:12px;color:#6b655a")}>ถูกรายงาน {u.reportCount} ครั้ง</div>
                </div>
                {u.isSuspended
                  ? <Badge bg="#FDEDEA" fg="#B8321F">ถูกระงับ</Badge>
                  : <Badge bg="#CFEEDB" fg="#1F5C3A">ใช้งานอยู่</Badge>}
              </div>
            ))}
          </Panel>
        </div>

        <div style={sx("display:flex;flex-direction:column;gap:20px;min-width:0")}>
          <Panel style="padding:18px 20px">
            <div style={sx("font-weight:800;font-size:15px;margin-bottom:4px")}>รายงานตามเหตุผล</div>
            <div style={sx("font-size:12px;color:#8a8378;margin-bottom:16px")}>นับจากรายงานทั้งหมด {a.totalReports} รายการ</div>
            {a.reasonBars.length === 0 && <div style={sx("font-size:13px;color:#8a8378")}>ยังไม่มีรายงานเข้ามา</div>}
            <div style={sx("display:flex;flex-direction:column;gap:14px")}>
              {a.reasonBars.map((bar) => (
                <div key={bar.key}>
                  <div style={sx("display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px")}>
                    <span style={sx("font-weight:700")}>{bar.label}</span>
                    <span style={sx("color:#6b655a")}>{bar.count}</span>
                  </div>
                  <div style={sx("height:8px;border-radius:100px;background:#F3EFE6;overflow:hidden")}>
                    <div style={{ height: "100%", borderRadius: 100, width: bar.pct, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={sx("border-top:1px solid #efe9dc;margin-top:20px;padding-top:16px")}>
              <div style={sx("font-weight:800;font-size:13px;margin-bottom:10px")}>สถานะรายงาน</div>
              <div style={sx("display:flex;height:10px;border-radius:100px;overflow:hidden;background:#F3EFE6")}>
                {a.statusBar.map((seg) => <div key={seg.key} style={{ height: "100%", width: seg.pct, background: seg.color }} />)}
              </div>
              <div style={sx("display:flex;gap:16px;flex-wrap:wrap;margin-top:10px")}>
                {a.statusBar.map((seg) => (
                  <span key={seg.key} style={sx("display:flex;align-items:center;gap:6px;font-size:12px;color:#4a453c")}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color }} />
                    {seg.label} {seg.count}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel style="overflow:hidden">
            <div style={sx("padding:16px 20px;border-bottom:1px solid #efe9dc;font-weight:800;font-size:15px")}>การดำเนินการล่าสุด</div>
            {overview.actions.length === 0 && <EmptyRow>ยังไม่มีการดำเนินการ</EmptyRow>}
            {overview.actions.map((entry) => (
              <div key={entry.id} style={sx("display:flex;gap:12px;padding:12px 20px;border-bottom:1px solid #f3efe6;align-items:flex-start")}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flex: "none", marginTop: 6 }} />
                <div style={sx("flex:1;min-width:0")}>
                  <div style={sx("font-size:14px")}><span style={sx("font-weight:800")}>{entry.label}</span> · {entry.detail}</div>
                  <div style={sx("font-size:12px;color:#8a8378;margin-top:2px")}>{entry.time}{entry.actorName ? ` · โดย ${entry.actorName}` : ""}</div>
                </div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}

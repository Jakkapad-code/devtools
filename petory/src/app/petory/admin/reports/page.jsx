"use client";
import { useEffect } from "react";
import { sx, Hoverable } from "../../ui";
import { useAdmin } from "../context";
import { Avatar, Badge, DangerButton, DarkButton, ErrorNote, GhostButton, LoadingNote, PostThumb, Segment } from "../components/AdminUI";

const FILTERS = [["pending", "รอตรวจสอบ"], ["resolved", "ดำเนินการแล้ว"], ["dismissed", "ปิดแล้ว"], ["all", "ทั้งหมด"]];
const TYPES = [["all", "ทั้งหมด"], ["post", "โพสต์"], ["user", "ผู้ใช้"]];

function Detail({ report, admin }) {
  if (!report) {
    return <div style={sx("margin:auto;text-align:center;color:#8a8378;font-size:14px")}>เลือกรายงานทางซ้ายเพื่อดูรายละเอียด</div>;
  }

  return (
    <div style={sx("display:flex;flex-direction:column;gap:22px;flex:1")}>
      <div>
        <div style={sx("display:flex;gap:8px;align-items:center;margin-bottom:8px")}>
          <Badge bg={report.typeBadge.bg} fg={report.typeBadge.fg}>{report.typeLabel}</Badge>
          <Badge bg={report.statusBadge.bg} fg={report.statusBadge.fg}>{report.statusLabel}</Badge>
        </div>
        <div style={sx("font-size:11px;font-weight:800;letter-spacing:0.06em;color:#a39c8e;margin-bottom:4px")}>เหตุผลที่ผู้ใช้รายงาน</div>
        <h2 style={sx("font-size:22px;font-weight:800;margin:0")}>{report.reasonTh}</h2>
        <div style={sx("font-size:13px;color:#8a8378;margin-top:2px")}>{report.reasonEn}</div>
        <div style={sx("font-size:13px;color:#4a453c;margin-top:10px;background:#FBF9F4;border:1px solid #efe9dc;border-radius:10px;padding:10px 12px;line-height:1.5")}>{report.reasonDesc}</div>
        <div style={sx("font-size:13px;color:#6b655a;margin-top:4px")}>รายงานโดย {report.reporterName} · {report.time}</div>
      </div>

      <div>
        <div style={sx("font-size:11px;font-weight:800;letter-spacing:0.06em;color:#a39c8e;margin-bottom:8px")}>
          {report.isPost ? "โพสต์ที่ถูกรายงาน" : "ผู้ใช้ที่ถูกรายงาน"}
        </div>
        <div style={sx("border:1px solid #efe9dc;border-radius:14px;overflow:hidden")}>
          <div style={sx("display:flex;align-items:center;gap:12px;padding:14px 16px")}>
            <Avatar color={report.targetColor} initial={report.targetInitial} src={report.targetAvatarSrc} size={40} />
            <div style={sx("flex:1;min-width:0")}>
              <div style={sx("font-weight:800;font-size:15px")}>{report.targetName}</div>
              <div style={sx("font-size:12px;color:#6b655a")}>{report.targetInfo}</div>
            </div>
            {report.isSuspended
              ? <Badge bg="#FDEDEA" fg="#B8321F">ถูกระงับ</Badge>
              : <Badge bg="#CFEEDB" fg="#1F5C3A">ใช้งานอยู่</Badge>}
          </div>
          {report.hasCaption && (
            <div style={sx("border-top:1px solid #efe9dc;display:flex;gap:14px;padding:14px 16px;background:#FBF9F4")}>
              <PostThumb src={report.photoSrc} bg={report.photoBg} size={72} />
              <div style={sx("font-size:14px;line-height:1.55;color:#3a352d")}>{report.caption}</div>
            </div>
          )}
        </div>
      </div>

      {report.isResolved && (
        <div style={sx("background:#F3EFE6;border-radius:12px;padding:12px 16px;font-size:13px;color:#4a453c")}>
          ผลการตรวจสอบ: <span style={sx("font-weight:800")}>{report.resolution}</span>
        </div>
      )}

      {report.isPending && (
        <div style={sx("margin-top:auto;border-top:1px solid #efe9dc;padding-top:18px;display:flex;gap:10px;flex-wrap:wrap;align-items:center")}>
          {report.canDeletePost && <DangerButton onClick={() => admin.openDeletePost(report.postId)}>ลบโพสต์</DangerButton>}
          <DarkButton onClick={() => admin.openSuspend(report.ownerId)}>ระงับบัญชี</DarkButton>
          <GhostButton onClick={() => admin.dismissReport(report.id)} style="margin-left:auto">ไม่พบการละเมิด</GhostButton>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const a = useAdmin();
  const selectedId = a.selected?.id;
  const { loadReports, ui } = a;

  useEffect(() => {
    void loadReports({ status: ui.reportFilter, type: ui.reportType });
  }, [loadReports, ui.reportFilter, ui.reportType]);

  return (
    <div style={sx("background:#fff;border-radius:16px;border:1px solid #e8e2d4;overflow:hidden;display:flex;flex-direction:column")}>
      <div style={sx("display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid #efe9dc")}>
        <div style={sx("display:flex;gap:2px;background:#F3EFE6;border-radius:10px;padding:3px")}>
          {TYPES.map(([key, label]) => (
            <Segment key={key} active={ui.reportType === key} onClick={() => a.setReportType(key)}>
              {label} <span style={sx("opacity:0.55")}>{a.typeCounts[key]}</span>
            </Segment>
          ))}
        </div>
        <div style={sx("display:flex;gap:2px;background:#F3EFE6;border-radius:10px;padding:3px;margin-left:auto;flex-wrap:wrap")}>
          {FILTERS.map(([key, label]) => (
            <Segment key={key} active={ui.reportFilter === key} onClick={() => a.setReportFilter(key)}>
              {label} <span style={sx("opacity:0.55")}>{key === "all" ? a.totalReports : a.counts[key]}</span>
            </Segment>
          ))}
        </div>
      </div>

      {a.error && <ErrorNote>{a.error}</ErrorNote>}
      {a.loading && <LoadingNote />}

      <div style={sx("display:flex;flex-wrap:wrap;min-height:520px")}>
        <div style={sx("flex:1 1 320px;max-width:100%;min-width:260px;border-right:1px solid #efe9dc;border-bottom:1px solid #efe9dc;max-height:640px;overflow-y:auto;padding-bottom:8px;background:#FBF9F4")}>
          {a.reports.length === 0 && (
            <div style={sx("padding:60px 20px;text-align:center;color:#8a8378;font-size:14px")}>ไม่มีรายงานในหมวดนี้</div>
          )}
          {a.groups.map((group) => (
            <div key={group.key}>
              <div style={sx("display:flex;align-items:center;gap:8px;padding:14px 18px 6px;font-size:11px;font-weight:800;letter-spacing:0.05em;color:#8a8378;text-transform:uppercase")}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: group.dot, flex: "none" }} />
                <span style={sx("min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{group.typeLabel} · {group.reason}</span>
                <span style={sx("margin-left:auto;flex:none")}>{group.count}</span>
              </div>
              {group.items.map((report) => {
                const on = report.id === selectedId;
                return (
                  <Hoverable
                    key={report.id}
                    onClick={() => a.selectReport(report.id)}
                    style={`display:flex;align-items:center;gap:12px;padding:12px 14px;margin:0 12px 8px;border-radius:12px;cursor:pointer;border:1px solid ${on ? "#E3402B;background:#FDF3F0;box-shadow:0 2px 8px rgba(227,64,43,0.12)" : "#ece7db;background:#fff"}`}
                    hoverStyle={on ? undefined : "border-color:#d9d3c6"}
                  >
                    <Avatar color={report.targetColor} initial={report.targetInitial} src={report.targetAvatarSrc} size={36} />
                    <div style={sx("flex:1;min-width:0")}>
                      <div style={sx("display:flex;justify-content:space-between;gap:8px")}>
                        <span style={sx("font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{report.targetName}</span>
                        <span style={sx("font-size:11px;color:#a39c8e;white-space:nowrap")}>{report.time}</span>
                      </div>
                      <div style={sx("display:flex;align-items:center;gap:6px;margin-top:4px;min-width:0")}>
                        <Badge bg="#FDEDEA" fg="#B8321F" style="white-space:nowrap;flex:none">{report.reasonTh}</Badge>
                        <span style={sx("font-size:12px;color:#6b655a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{report.preview}</span>
                      </div>
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: report.statusDot, flex: "none" }} />
                  </Hoverable>
                );
              })}
            </div>
          ))}
        </div>

        <div style={sx("flex:1.4 1 360px;min-width:0;padding:26px 28px;display:flex;flex-direction:column")}>
          <Detail report={a.selected} admin={a} />
        </div>
      </div>
    </div>
  );
}

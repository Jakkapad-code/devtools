"use client";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sx, Hoverable, LOGO } from "../ui";
import { usePetory } from "../context";
import { ADMIN_TABS } from "./constants";
import { AdminProvider, useAdmin } from "./context";
import AdminModals from "./components/AdminModals";

function NavIcon({ path, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d={path} />
    </svg>
  );
}

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { openLogoutConfirm } = usePetory();
  const { ui, counts, toggleSidebar } = useAdmin();
  const open = !ui.sidebarCollapsed;
  const width = open ? 232 : 76;

  return (
    <aside
      style={{
        flex: `0 0 ${width}px`, width, background: "#fff", borderRight: "1px solid #e8e2d4",
        display: "flex", flexDirection: "column", padding: `22px ${open ? 16 : 14}px`,
        position: "sticky", top: 0, height: "100vh", boxSizing: "border-box", overflow: "hidden",
        transition: "flex-basis 0.22s ease, width 0.22s ease, padding 0.22s ease",
      }}
    >
      <div style={sx("display:flex;align-items:center;gap:10px;padding:0 4px 22px;min-height:38px")}>
        {open && (
          <>
            <Image src={LOGO} alt="Petory" width={45} height={38} style={{ height: 38, width: "auto" }} priority />
            <span style={sx("background:#F0C93B;color:#201C16;font-weight:800;font-size:10px;letter-spacing:0.08em;padding:4px 10px;border-radius:100px")}>ADMIN</span>
          </>
        )}
        <Hoverable
          as="button"
          onClick={toggleSidebar}
          title={open ? "ย่อเมนู" : "ขยายเมนู"}
          style="margin-left:auto;margin-right:auto;width:34px;height:34px;flex:none;border:1px solid #e8e2d4;background:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a453c"
          hoverStyle="background:#F5F1E8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d={open ? "M16 10l-2 2 2 2" : "M13 10l2 2-2 2"} />
          </svg>
        </Hoverable>
      </div>

      {open && <div style={sx("font-size:11px;font-weight:800;letter-spacing:0.08em;color:#a39c8e;padding:0 12px 8px")}>เมนู</div>}

      <nav style={sx("display:flex;flex-direction:column;gap:4px")}>
        {ADMIN_TABS.map((tab) => {
          const active = pathname === tab.href;
          const flagged = tab.key === "reports" && counts.pending > 0;
          return (
            <Hoverable
              key={tab.key}
              onClick={() => router.push(tab.href)}
              title={tab.label}
              style={`display:flex;align-items:center;justify-content:${open ? "space-between" : "center"};padding:10px 12px;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;position:relative;${!open && flagged ? "box-shadow:inset -3px 0 0 #E3402B;" : ""}${active ? "background:#201C16;color:#fff" : "color:#4a453c"}`}
              hoverStyle={active ? undefined : "background:#F5F1E8"}
            >
              <span style={sx("display:flex;align-items:center;gap:10px;position:relative")}>
                <NavIcon path={tab.icon} />
                {open && <span style={sx("white-space:nowrap")}>{tab.label}</span>}
              </span>
              {open && flagged && (
                <span style={sx("background:#E3402B;color:#fff;font-size:11px;font-weight:800;min-width:20px;height:20px;border-radius:100px;display:flex;align-items:center;justify-content:center;padding:0 6px;box-sizing:border-box")}>
                  {counts.pending}
                </span>
              )}
            </Hoverable>
          );
        })}
      </nav>

      <div style={sx("margin-top:auto;border-top:1px solid #efe9dc;padding:16px 0 0;display:flex;flex-direction:column;gap:10px;align-items:stretch")}>
        {open && (
          <div style={sx("display:flex;align-items:center;gap:10px;padding:0 4px")}>
            <div style={sx("width:34px;height:34px;border-radius:50%;background:#201C16;color:#F0C93B;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex:none")}>A</div>
            <div style={sx("min-width:0")}>
              <div style={sx("font-weight:800;font-size:13px")}>ผู้ดูแลระบบ</div>
              <div style={sx("font-size:12px;color:#8a8378;overflow:hidden;text-overflow:ellipsis")}>admin@petory.co</div>
            </div>
          </div>
        )}
        <Hoverable
          as="button"
          onClick={openLogoutConfirm}
          title="ออกจากระบบ"
          style="background:#fff;color:#E3402B;border:1px solid #f0c6bd;border-radius:10px;padding:9px;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap"
          hoverStyle="background:#FDEDEA"
        >
          <NavIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={16} />
          {open && <span>ออกจากระบบ</span>}
        </Hoverable>
      </div>
    </aside>
  );
}

function AdminShell({ children }) {
  const pathname = usePathname();
  const { loadOverview } = useAdmin();
  const tab = ADMIN_TABS.find((t) => t.href === pathname) || ADMIN_TABS[0];

  // The overview carries the sidebar's pending badge as well as the dashboard,
  // so it is fetched here once rather than by whichever page happens to be open.
  useEffect(() => { void loadOverview(); }, [loadOverview]);

  return (
    <div style={sx("min-height:100vh;display:flex;background:#F5F1E8")}>
      <Sidebar />
      <main style={sx("flex:1;min-width:0;padding:32px clamp(20px,3vw,44px) 60px;display:flex;flex-direction:column;gap:24px")}>
        <div>
          <h1 style={sx("font-family:'Anton',sans-serif;font-size:32px;text-transform:uppercase;margin:0;letter-spacing:0.01em")}>{tab.title}</h1>
          <p style={sx("margin:6px 0 0;font-size:14px;color:#6b655a")}>{tab.sub}</p>
        </div>
        {children}
      </main>
      <AdminModals />
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}

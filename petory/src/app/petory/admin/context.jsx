"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { adminClient } from "@/features/auth/client";
import { usePetory } from "../context";
import { avatarInitial, hashColor, mediaSrc } from "../helpers";
import {
  ACTION_META, reasonDesc, reasonTh, STATUS_META, SUSPEND_REASONS, suspendedUntilLabel, timeAgo,
} from "./constants";

const AdminContext = createContext(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}

const EMPTY_COUNTS = { pending: 0, resolved: 0, dismissed: 0 };

/** Adds the labels, colours and initials the console draws with. */
function toReportView(row) {
  const status = STATUS_META[row.status] ?? STATUS_META.pending;
  const isPost = row.type === "post";
  const targetInfo = `${row.targetLocation || "ไม่ระบุที่อยู่"} · ${row.targetPostCount ?? 0} โพสต์`;
  return {
    ...row,
    isPost,
    time: timeAgo(row.createdAt),
    reasonEn: row.reason,
    reasonTh: reasonTh(row.reason),
    reasonDesc: reasonDesc(row.reason),
    typeLabel: isPost ? "โพสต์" : "ผู้ใช้",
    typeBadge: isPost ? { bg: "#F4C9D6", fg: "#7A1F3A" } : { bg: "#D6E4EC", fg: "#1E3E4F" },
    statusLabel: status.label,
    statusBadge: { bg: status.bg, fg: status.fg },
    statusDot: status.dot,
    targetColor: hashColor(String(row.ownerId || row.targetId)),
    targetInitial: avatarInitial(row.targetName),
    targetAvatarSrc: mediaSrc(row.targetAvatarMediaId),
    targetInfo,
    isSuspended: Boolean(row.targetSuspended),
    hasCaption: isPost,
    caption: row.caption || "โพสต์ถูกลบแล้ว",
    photoSrc: mediaSrc(row.postPhotoMediaId),
    photoBg: row.postId ? hashColor(row.postId) : "#ECE7DB",
    // A post already removed cannot be removed again; only the account action is left.
    canDeletePost: isPost && Boolean(row.postId) && !row.postDeleted,
    isPending: row.status === "pending",
    isResolved: row.status !== "pending",
    resolution: row.resolution || "",
    preview: isPost ? (row.caption || "โพสต์ถูกลบแล้ว") : targetInfo,
  };
}

function toUserView(row) {
  return {
    ...row,
    location: row.location || "ไม่ระบุที่อยู่",
    color: hashColor(row.id),
    initial: avatarInitial(row.name),
    avatarSrc: mediaSrc(row.avatarMediaId),
    suspendNote: row.isSuspended ? `${suspendedUntilLabel(row.suspendedUntil)} · ${row.suspensionReason || ""}` : "",
  };
}

function toPostView(row) {
  return { ...row, photoSrc: mediaSrc(row.photoMediaId), photoBg: hashColor(row.id) };
}

export function AdminProvider({ children }) {
  const { showToast } = usePetory();

  const [data, setData] = useState({ overview: null, reports: [], counts: EMPTY_COUNTS, posts: [], users: [] });
  const [ui, setUi] = useState({
    reportFilter: "pending", reportType: "all", search: "", selectedReportId: null,
    sidebarCollapsed: false, modal: null,
    suspendTargetId: null, suspendDuration: "7", suspendReason: SUSPEND_REASONS[0], deleteTargetId: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setUiState = (patch) => setUi((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));

  /**
   * One wrapper around every read: it owns the spinner and turns a rejected
   * request into a message on screen instead of an unhandled rejection. A
   * failed load leaves the previous rows in place rather than blanking a table
   * the operator was reading.
   */
  const load = useCallback(async (run) => {
    setLoading(true);
    setError(null);
    try {
      await run();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOverview = useCallback(() => load(async () => {
    const overview = await adminClient.overview();
    setData((prev) => ({
      ...prev,
      overview: {
        ...overview,
        pendingQueue: overview.pendingQueue.map(toReportView),
        topReportedUsers: overview.topReportedUsers.map(toUserView),
        actions: overview.actions.map((entry) => ({
          ...entry,
          label: ACTION_META[entry.action]?.label ?? entry.action,
          color: ACTION_META[entry.action]?.color ?? "#C9C2B3",
          time: timeAgo(entry.createdAt),
        })),
      },
      counts: overview.counts,
    }));
  }), [load]);

  const loadReports = useCallback((filters) => load(async () => {
    const { reports, counts } = await adminClient.reports(filters);
    setData((prev) => ({ ...prev, reports: reports.map(toReportView), counts }));
  }), [load]);

  const loadPosts = useCallback((search) => load(async () => {
    const { posts } = await adminClient.posts(search);
    setData((prev) => ({ ...prev, posts: posts.map(toPostView) }));
  }), [load]);

  const loadUsers = useCallback((search) => load(async () => {
    const { users } = await adminClient.users(search);
    setData((prev) => ({ ...prev, users: users.map(toUserView) }));
  }), [load]);

  // ---- filters ----
  const setReportFilter = (reportFilter) => setUiState({ reportFilter, selectedReportId: null });
  const setReportType = (reportType) => setUiState({ reportType, selectedReportId: null });
  const selectReport = (selectedReportId) => setUiState({ selectedReportId });
  const onSearch = (e) => { const search = e.target.value; setUiState({ search }); };
  const toggleSidebar = () => setUiState((prev) => ({ sidebarCollapsed: !prev.sidebarCollapsed }));

  // ---- modals ----
  const closeModal = () => setUiState({ modal: null });
  const openSuspend = (userId) => setUiState({ modal: "suspend", suspendTargetId: userId, suspendDuration: "7", suspendReason: SUSPEND_REASONS[0] });
  const openDeletePost = (postId) => setUiState({ modal: "deletePost", deleteTargetId: postId });
  const setSuspendDuration = (suspendDuration) => setUiState({ suspendDuration });
  const setSuspendReason = (suspendReason) => setUiState({ suspendReason });

  /** Any write changes counts on every screen, so the queue is always refetched. */
  const afterWrite = () => Promise.all([
    loadReports({ status: ui.reportFilter, type: ui.reportType }),
    loadOverview(),
  ]);

  const confirmSuspend = async () => {
    const id = ui.suspendTargetId;
    if (!id) return;
    try {
      await adminClient.suspend(id, ui.suspendDuration, ui.suspendReason);
      setUiState({ modal: null });
      showToast("ระงับบัญชีแล้ว");
      await Promise.all([afterWrite(), loadUsers(ui.search)]);
    } catch (writeError) {
      showToast(writeError.message);
    }
  };

  const unsuspendUser = async (id) => {
    try {
      await adminClient.unsuspend(id);
      showToast("ยกเลิกการระงับแล้ว");
      await Promise.all([afterWrite(), loadUsers(ui.search)]);
    } catch (writeError) {
      showToast(writeError.message);
    }
  };

  const confirmDeletePost = async () => {
    const id = ui.deleteTargetId;
    if (!id) return;
    try {
      await adminClient.removePost(id);
      setUiState({ modal: null });
      showToast("ลบโพสต์แล้ว");
      await Promise.all([afterWrite(), loadPosts(ui.search)]);
    } catch (writeError) {
      showToast(writeError.message);
    }
  };

  const dismissReport = async (reportId) => {
    try {
      await adminClient.resolveReport(reportId, "dismissed", "ไม่พบการละเมิด");
      showToast("ปิดรายงานแล้ว");
      await afterWrite();
    } catch (writeError) {
      showToast(writeError.message);
    }
  };

  const derived = useMemo(() => {
    const { reports, counts, overview } = data;
    // The selection follows the filtered list: a report filtered away hands the
    // detail pane to the first row instead of leaving it blank.
    const selected = reports.find((r) => r.id === ui.selectedReportId) || reports[0] || null;

    // Rows are grouped by type + reason so a run of identical complaints reads
    // as one batch instead of several separate decisions.
    const order = [];
    const byKey = {};
    reports.slice().sort((a, b) => (a.type === b.type ? 0 : a.type === "post" ? -1 : 1)).forEach((report) => {
      const key = `${report.type}|${report.reasonEn}`;
      if (!byKey[key]) {
        byKey[key] = { key, reason: report.reasonTh, typeLabel: report.typeLabel, dot: report.isPost ? "#B5566D" : "#2B5468", items: [] };
        order.push(byKey[key]);
      }
      byKey[key].items.push(report);
    });

    const reasonMax = Math.max(1, ...(overview?.reasons ?? []).map((row) => row.count));
    const reasonBars = (overview?.reasons ?? []).map((row) => ({
      key: `${row.type}|${row.reason}`,
      label: (row.type === "post" ? "โพสต์ · " : "ผู้ใช้ · ") + reasonTh(row.reason),
      count: row.count,
      pct: Math.round((row.count / reasonMax) * 100) + "%",
      color: row.type === "post" ? "#B5566D" : "#2B5468",
    }));

    const totalReports = overview?.totalReports ?? (counts.pending + counts.resolved + counts.dismissed);
    const statusBar = ["pending", "resolved", "dismissed"].map((key) => ({
      key, label: STATUS_META[key].label, count: counts[key] ?? 0, color: STATUS_META[key].dot,
      pct: (totalReports ? Math.round(((counts[key] ?? 0) / totalReports) * 100) : 0) + "%",
    }));

    return {
      selected,
      groups: order.map((group) => ({ ...group, count: group.items.length })),
      reasonBars, statusBar, totalReports,
      // The type chips count what the current status filter returned, so they
      // stay consistent with the list below them.
      typeCounts: {
        all: reports.length,
        post: reports.filter((r) => r.isPost).length,
        user: reports.filter((r) => !r.isPost).length,
      },
      suspendTargetName: data.users.find((u) => u.id === ui.suspendTargetId)?.name
        ?? reports.find((r) => r.ownerId === ui.suspendTargetId)?.targetName ?? "",
      deleteTarget: data.posts.find((p) => p.id === ui.deleteTargetId)
        ?? reports.find((r) => r.postId === ui.deleteTargetId) ?? null,
    };
  }, [data, ui.selectedReportId, ui.suspendTargetId, ui.deleteTargetId]);

  const value = {
    ui, loading, error,
    overview: data.overview, reports: data.reports, counts: data.counts, posts: data.posts, users: data.users,
    ...derived,
    deleteTargetAuthor: derived.deleteTarget?.authorName ?? derived.deleteTarget?.targetName ?? "",
    loadOverview, loadReports, loadPosts, loadUsers,
    setReportFilter, setReportType, selectReport, onSearch, toggleSidebar,
    openSuspend, openDeletePost, closeModal, setSuspendDuration, setSuspendReason,
    confirmSuspend, confirmDeletePost, unsuspendUser, dismissReport,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

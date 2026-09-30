// Reason codes are stored in English (the report modals submit these strings);
// the console shows Thai, so every screen reads from the same two maps.
export const REPORT_REASON_TH = {
  "Spam": "สแปม / โฆษณา",
  "Inappropriate Content": "เนื้อหาไม่เหมาะสม",
  "Animal Abuse": "ทารุณกรรมสัตว์",
  "False Information": "ข้อมูลเท็จ",
  "Harassment": "คุกคาม / กลั่นแกล้ง",
  "Fake Account": "บัญชีปลอม",
  "Unsafe Behavior": "พฤติกรรมไม่ปลอดภัย",
  "Inappropriate Behavior": "พฤติกรรมไม่เหมาะสม",
};

export const REPORT_REASON_DESC = {
  "Spam": "โพสต์หรือข้อความซ้ำๆ โฆษณาสินค้า หรือลิงก์ที่ไม่เกี่ยวข้อง",
  "Inappropriate Content": "รูปภาพหรือข้อความที่ไม่เหมาะสมกับชุมชน",
  "Animal Abuse": "เนื้อหาที่แสดงหรือส่งเสริมการทำร้ายสัตว์",
  "False Information": "ข้อมูลที่ไม่ถูกต้อง อาจทำให้ผู้เลี้ยงเข้าใจผิด",
  "Harassment": "การคุกคาม ด่าทอ หรือกลั่นแกล้งผู้ใช้อื่น",
  "Fake Account": "บัญชีที่แอบอ้างเป็นบุคคลอื่นหรือไม่มีตัวตนจริง",
  "Unsafe Behavior": "พฤติกรรมที่อาจเป็นอันตรายเมื่อนัดพบกัน",
  "Inappropriate Behavior": "การพูดจาหรือพฤติกรรมที่ไม่สุภาพต่อผู้อื่น",
};

export function reasonTh(reason) {
  return REPORT_REASON_TH[reason] || reason;
}

export function reasonDesc(reason) {
  return REPORT_REASON_DESC[reason] || "";
}

export const STATUS_META = {
  pending: { label: "รอตรวจสอบ", bg: "#FFF3CC", fg: "#7A5A00", dot: "#F0B429" },
  resolved: { label: "ดำเนินการแล้ว", bg: "#CFEEDB", fg: "#1F5C3A", dot: "#3E9B63" },
  dismissed: { label: "ปิดแล้ว", bg: "#ECE7DB", fg: "#4a453c", dot: "#C9C2B3" },
};

export const ADMIN_TABS = [
  { key: "dashboard", href: "/petory/admin", label: "ภาพรวม", title: "ภาพรวม", sub: "สรุปสถานะระบบ Petory วันนี้", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { key: "reports", href: "/petory/admin/reports", label: "รายงานจากผู้ใช้", title: "รายงานจากผู้ใช้", sub: "ตรวจสอบรายงานโพสต์และผู้ใช้ แล้วดำเนินการตามความเหมาะสม", icon: "M4 22V4a1 1 0 0 1 1-1h11l-2 5 2 5H5" },
  { key: "posts", href: "/petory/admin/posts", label: "จัดการโพสต์", title: "จัดการโพสต์", sub: "ค้นหาและลบโพสต์ที่ไม่เหมาะสม", icon: "M4 4h16v16H4zM4 9h16M9 9v11" },
  { key: "users", href: "/petory/admin/users", label: "จัดการผู้ใช้", title: "จัดการผู้ใช้", sub: "ดูสถานะบัญชี ระงับ หรือยกเลิกการระงับผู้ใช้", icon: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8" },
];

export const SUSPEND_DURATIONS = [["7", "7 วัน"], ["30", "30 วัน"], ["90", "90 วัน"], ["perm", "ถาวร"]];

export const SUSPEND_REASONS = ["พฤติกรรมไม่เหมาะสม", "สแปม / โฆษณา", "บัญชีปลอม", "โพสต์เนื้อหาไม่เหมาะสมซ้ำ"];

/** Thai labels and dot colours for the moderation log. */
export const ACTION_META = {
  suspend: { label: "ระงับบัญชี", color: "#201C16" },
  unsuspend: { label: "ยกเลิกการระงับ", color: "#3E9B63" },
  delete_post: { label: "ลบโพสต์", color: "#E3402B" },
  dismiss_report: { label: "ปิดรายงาน", color: "#C9C2B3" },
};

/** Timestamps arrive as ISO strings; the console shows how long ago. */
export function timeAgo(value) {
  if (!value) return "";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "เมื่อวาน";
  return `${days} วันก่อน`;
}

/** How a suspension's end date reads on screen. */
export function suspendedUntilLabel(until) {
  if (!until) return "ถาวร";
  return "ถึง " + new Date(until).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

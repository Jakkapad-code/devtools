"use client";
import { useEffect } from "react";
import { sx, Hoverable } from "../../ui";
import { CATEGORY_LABELS } from "../../constants";
import { useAdmin } from "../context";
import { Badge, EmptyRow, ErrorNote, LoadingNote, PostThumb, SearchBar } from "../components/AdminUI";

const COLUMNS = "minmax(0,1fr) 140px 110px 110px";

export default function AdminPostsPage() {
  const a = useAdmin();
  const { loadPosts, ui } = a;

  // Typing should not fire a query per keystroke; the last one within the
  // pause is the one that runs, and switching pages cancels it.
  useEffect(() => {
    const timer = setTimeout(() => { void loadPosts(ui.search); }, 250);
    return () => clearTimeout(timer);
  }, [loadPosts, ui.search]);

  return (
    <div style={sx("background:#fff;border-radius:16px;border:1px solid #e8e2d4;overflow:hidden")}>
      <SearchBar value={ui.search} onChange={a.onSearch} placeholder="ค้นหาโพสต์หรือชื่อผู้โพสต์..." />
      {a.error && <ErrorNote>{a.error}</ErrorNote>}
      {a.loading && <LoadingNote />}

      <div style={{ display: "grid", gridTemplateColumns: COLUMNS, gap: 12, padding: "10px 18px", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color: "#a39c8e", borderBottom: "1px solid #efe9dc" }}>
        <span>โพสต์</span><span>หมวด</span><span>รายงาน</span><span />
      </div>

      {!a.loading && a.posts.length === 0 && (
        <EmptyRow pad="60px 20px">{ui.search ? "ไม่พบโพสต์ที่ตรงกับคำค้นหา" : "ยังไม่มีโพสต์ในระบบ"}</EmptyRow>
      )}

      {a.posts.map((post) => (
        <Hoverable
          key={post.id}
          style={`display:grid;grid-template-columns:${COLUMNS};gap:12px;align-items:center;padding:12px 18px;border-bottom:1px solid #f3efe6`}
          hoverStyle="background:#FBF9F4"
        >
          <div style={sx("display:flex;align-items:center;gap:12px;min-width:0")}>
            <PostThumb src={post.photoSrc} bg={post.photoBg} />
            <div style={sx("min-width:0")}>
              <div style={sx("font-weight:800;font-size:13px")}>{post.authorName}</div>
              <div style={sx("font-size:13px;color:#4a453c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{post.caption}</div>
            </div>
          </div>
          <span style={sx("font-size:13px;color:#6b655a")}>{CATEGORY_LABELS[post.category] || post.category}</span>
          {post.reportCount > 0
            ? <Badge bg="#FDEDEA" fg="#B8321F" style="justify-self:start">{post.reportCount} รายงาน</Badge>
            : <span style={sx("font-size:13px;color:#a39c8e")}>—</span>}
          <Hoverable
            as="button"
            onClick={() => a.openDeletePost(post.id)}
            style="justify-self:end;background:#fff;color:#E3402B;border:1px solid #f0c6bd;border-radius:10px;padding:8px 14px;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap"
            hoverStyle="background:#FDEDEA"
          >
            ลบโพสต์
          </Hoverable>
        </Hoverable>
      ))}
    </div>
  );
}

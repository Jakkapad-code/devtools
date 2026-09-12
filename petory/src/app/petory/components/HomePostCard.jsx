"use client";
import { sx, Hoverable, ImageSlot } from "../ui";

export default function HomePostCard({ post }) {
  return (
    <Hoverable style="border: none; border-radius: 20px; overflow: hidden; background: #fff; box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px; transition: transform 0.2s ease,box-shadow 0.2s ease" hoverStyle="transform:translateY(-4px);box-shadow:rgba(0, 0, 0, 0.22) 0px 4px 12px">
      <div style={sx("display: flex; align-items: center; gap: 10px; padding: 14px 16px; background-color: #FFFFFFED")}>
        <div onClick={post.onAuthorClick} style={sx(`width:38px;height:38px;border-radius:50%;background:${post.authorColor};flex:none;cursor:pointer`)} />
        <div onClick={post.onAuthorClick} style={sx("flex:1;min-width:0;cursor:pointer")}>
          <div style={sx("font-weight:800;font-size:14px")}>{post.authorName}</div>
          {post.petName && <span style={sx("display:inline-block;margin-top:2px;background:#F4C9D6;color:#201C16;font-weight:700;font-size:11px;padding:3px 10px;border-radius:100px")}>🐾 {post.petName}</span>}
        </div>
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <span onClick={post.onMenuToggle} style={sx("background:none;border:none;color:#8a8378;font-weight:800;font-size:16px;padding:6px 10px;border-radius:100px;cursor:pointer;letter-spacing:2px")}>•••</span>
          {post.menuOpen && (
            <div style={sx("position:absolute;right:0;top:calc(100% + 4px);background:#fff;border-radius:14px;box-shadow:rgba(0, 0, 0, 0.2) 0px 8px 20px;padding:6px;min-width:160px;z-index:10;display:flex;flex-direction:column")}>
              {post.isMine ? (
                <>
                  <span onClick={post.onEdit} style={sx("padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;border-radius:10px")}>แก้ไขโพสต์</span>
                  <span onClick={post.onDelete} style={sx("padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;border-radius:10px;color:#E3402B")}>ลบโพสต์</span>
                </>
              ) : (
                <>
                  <span onClick={post.onReport} style={sx("padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;border-radius:10px")}>รายงานโพสต์</span>
                  <span onClick={post.onBlock} style={sx("padding:10px 14px;font-weight:700;font-size:13px;cursor:pointer;border-radius:10px")}>บล็อกผู้ใช้</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={sx(`position:relative;height:390px;background:${post.photoBg}`)}>
        {post.isMine && <ImageSlot shape="rect" placeholder={post.imageLabel} style="width:100%;height:100%" />}
      </div>
      <div style={sx("padding: 16px; display: flex; flex-direction: column; gap: 14px; background-color: #FFFFFFED")}>
        <div style={sx("display:flex;align-items:center;gap:10px")}>
          <button onClick={post.onLike} style={sx(`background:none;border:none;width:44px;height:44px;cursor:pointer;color:${post.likeColor};display:flex;align-items:center;justify-content:center;padding:0;transition:transform 0.15s ease`)}>
            <span style={sx(`display:inline-flex;${post.likeAnim}`)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill={post.likeFill} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 20.3 3.5 12C1.6 10 1.8 6.7 4 5c1.9-1.5 4.6-1.2 6.2.6L12 7.5l1.8-1.9c1.6-1.8 4.3-2.1 6.2-.6 2.2 1.7 2.4 5 .5 7L12 20.3z" /></svg>
            </span>
          </button>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.3-3.4A7.9 7.9 0 0 1 4 12z" /></svg>
          <button onClick={post.onToggleComments} style={sx("background:none;border:none;width:44px;height:44px;cursor:pointer;color:#201C16;display:flex;align-items:center;justify-content:center;padding:0;transition:transform 0.15s ease")} />
          <button onClick={post.onSave} style={sx(`margin-left: auto; background: none; border: none; cursor: pointer; color: ${post.saveColor}; display: flex; align-items: center; justify-content: center; padding: 0; width: 44px; height: 44px; transition: transform 0.15s ease; font-size: 14px`)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={post.saveFill} stroke="currentColor" strokeWidth="2" style={{ stroke: "#000000" }}><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>
          </button>
        </div>
        <div style={sx("font-weight:800;font-size:15px;color:#E3402B;margin-top:-8px")}>{post.likes} ถูกใจ</div>
        <p style={sx("margin:6px 0 0;font-size:14px;line-height:1.6")}><span style={sx("font-weight:800")}>{post.authorName}</span> {post.caption}</p>
        <span onClick={post.onToggleComments} style={sx("font-weight:700;font-size:13px;color:#8a8378;cursor:pointer")}>{post.commentsToggleLabel}</span>
        {post.commentsOpen && (
          <div style={sx("background:#F5F1E8;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px")}>
            {post.comments.map((c, i) => (
              <div key={i} style={sx("display:flex;gap:10px;align-items:flex-start")}>
                <div style={sx(`width:28px;height:28px;border-radius:50%;background:${c.color};flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px`)}>{c.initial}</div>
                <div style={sx("font-size:14px;line-height:1.5")}><span style={sx("font-weight:800")}>{c.user}</span> {c.text}</div>
              </div>
            ))}
            <div style={sx("display:flex;gap:10px;align-items:center;margin-top:4px")}>
              <input placeholder="เขียนความคิดเห็น..." value={post.commentDraft} onChange={post.onCommentChange} onKeyDown={post.onCommentKeyDown} style={sx("flex:1;padding:12px 16px;border-radius:100px;border:none;font-size:14px;background:#fff;box-shadow:0 2px 8px rgba(32,28,22,0.08)")} />
              <button onClick={post.onCommentSubmit} style={sx("background:#E3402B;color:#fff;border:none;border-radius:100px;padding:12px 20px;font-weight:800;font-size:13px;cursor:pointer")}>ส่ง</button>
            </div>
          </div>
        )}
        <span style={sx("font-size:12px;color:#8a8378")}>{post.time}</span>
      </div>
    </Hoverable>
  );
}

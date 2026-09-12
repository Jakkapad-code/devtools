"use client";
import { use } from "react";
import { sx, Hoverable, ImageSlot } from "../../ui";
import { usePetory } from "../../context";
import { userById, petById, hashColor, categoryLabel } from "../../helpers";
import { BLOG_TITLES } from "../../constants";
import BackLink from "../../components/BackLink";

export default function PostDetailPage({ params }) {
  const { id } = use(params);
  const { state: s, ...a } = usePetory();
  const p = s.posts.find((pp) => pp.id === id);
  if (!p) return <div style={sx("max-width:760px;margin:0 auto;padding:48px;text-align:center")}>ไม่พบโพสต์นี้</div>;

  const author = userById(s, p.authorId);
  const pet = petById(s, p.petId);
  const isMine = p.authorId === "me";

  return (
    <div style={sx("max-width:760px;margin:0 auto;padding:clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px")}>
      <BackLink fallbackHref="/petory/explore" />
      <div style={sx("border-radius:24px;padding:24px;margin-top:20px;background:#fff;box-shadow: rgba(0, 0, 0, 0.15) 0px 15px 25px, rgba(0, 0, 0, 0.05) 0px 5px 10px")}>
        <div style={sx(`height:320px;border-radius:16px;margin-bottom:20px;overflow:hidden;background:${hashColor(p.id)}`)}>
          {isMine && <ImageSlot shape="rect" placeholder={pet ? pet.name + " PHOTO" : "POST PHOTO"} style="width:100%;height:100%" />}
        </div>
        <div style={sx("display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px")}>
          <span style={sx("background:#F4C9D6;color:#201C16;font-weight:700;font-size:12px;padding:6px 14px;border-radius:100px")}>{categoryLabel(p)}</span>
        </div>
        {(p.title || (p.category !== "story" && BLOG_TITLES[p.id])) && (
          <h1 style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.1;text-transform:uppercase;margin:0 0 16px")}>{p.title || BLOG_TITLES[p.id]}</h1>
        )}
        <div style={sx("display:flex;align-items:center;gap:10px;margin-bottom:18px")}>
          <div style={sx(`width:34px;height:34px;border-radius:50%;background:${author.color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;flex:none`)}>{author.name.charAt(0)}</div>
          <div>
            <div style={sx("font-weight:800;font-size:15px")}>{author.name}</div>
            <div style={sx("font-size:12px;color:#8a8378")}>{p.time}</div>
          </div>
          <div style={sx("margin-left:auto;display:flex;gap:10px")}>
            {isMine ? (
              <>
                <button onClick={() => a.openEditPost(p.id)} style={sx("border:2px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer")}>Edit</button>
                <button onClick={() => a.openDeletePost(p.id)} style={sx("border:2px solid #201C16;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer")}>Delete</button>
              </>
            ) : (
              <>
                <Hoverable as="button" onClick={() => a.openReportPost(p.id)} style="border:1px solid #b8b2a6;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer;transition:all 0.2s ease" hoverStyle="background:#201C16;color:#fff;border-color:#201C16;transform:translateY(-2px)">Report post</Hoverable>
                <Hoverable as="button" onClick={() => a.openBlock(p.authorId)} style="border:1px solid #b8b2a6;background:#fff;border-radius:100px;padding:8px 16px;font-weight:800;font-size:12px;cursor:pointer;transition:all 0.2s ease" hoverStyle="background:#E3402B;color:#fff;border-color:#E3402B;transform:translateY(-2px)">Block user</Hoverable>
              </>
            )}
          </div>
        </div>
        <p style={sx("font-size:16px;line-height:1.7;margin:0 0 20px;white-space:pre-line")}>{p.caption}</p>
        <div style={sx("display:flex;gap:20px;align-items:center;border-top:1px solid #e2ddd2;padding:14px 0;margin-bottom:8px")}>
          <button onClick={() => a.toggleLike(p.id)} style={sx(`background:none;border:none;cursor:pointer;font-weight:800;font-size:14px;color:${p.liked ? "#E3402B" : "#201C16"};display:flex;align-items:center;gap:6px;padding:0`)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={p.liked ? "#E3402B" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.3 3.5 12C1.6 10 1.8 6.7 4 5c1.9-1.5 4.6-1.2 6.2.6L12 7.5l1.8-1.9c1.6-1.8 4.3-2.1 6.2-.6 2.2 1.7 2.4 5 .5 7L12 20.3z" /></svg> {p.likes} ถูกใจ
          </button>
          <button onClick={() => a.toggleSave(p.id)} style={sx(`border: 1px solid #b8b2a6; border-radius: 100px; padding: 8px 16px; cursor: pointer; font-weight: 800; font-size: 12px; color: #201C16; margin-left: auto; background: ${p.saved ? "#F0C93B" : "#fff"}`)}>{p.saved ? "บันทึกแล้ว" : "บันทึกไว้อ่าน"}</button>
        </div>
        <div style={sx("font-family:'Anton',sans-serif;font-size:15px;text-transform:uppercase;margin-bottom:14px")}>ความคิดเห็น ({p.comments.length})</div>
        <div style={sx("display:flex;flex-direction:column;gap:10px")}>
          {p.comments.map((c, i) => (
            <div key={i} style={sx("display:flex;gap:10px;background:#F5F1E8;border-radius:14px;padding:12px 14px")}>
              <div style={sx(`width:28px;height:28px;border-radius:50%;background:${c.color};flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px`)}>{c.user.charAt(0)}</div>
              <div><span style={sx("font-weight:800;font-size:13px")}>{c.user}</span><p style={sx("margin:2px 0 0;font-size:14px")}>{c.text}</p></div>
            </div>
          ))}
          <div style={sx("display:flex;gap:10px;align-items:center;margin-top:6px")}>
            <input placeholder="เขียนความคิดเห็น..." value={s.commentDrafts[p.id] || ""} onChange={(e) => a.onCommentDraft(p.id, e)} onKeyDown={(e) => { if (e.key === "Enter") a.submitComment(p.id); }} style={sx("flex:1;padding:13px 16px;border-radius:100px;border:none;font-size:14px;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px")} />
            <Hoverable as="button" onClick={() => a.submitComment(p.id)} style="background:#E3402B;color:#fff;border:none;border-radius:100px;padding:13px 24px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:pointer;transition:transform 0.15s ease" hoverStyle="transform:translateY(-2px) scale(1.04)" activeStyle="transform:scale(0.92)">Send</Hoverable>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { sx, Hoverable, ImageSlot } from "../ui";

export default function ExplorePostCard({ post }) {
  return (
    <Hoverable style="border:none;border-radius:18px;overflow:hidden;background:#fff;display:flex;flex-direction:column;box-shadow:rgba(0, 0, 0, 0.16) 0px 1px 4px;transition:transform 0.2s ease,box-shadow 0.2s ease" hoverStyle="transform:translateY(-4px);box-shadow:rgba(0, 0, 0, 0.22) 0px 4px 12px">
      <div onClick={post.onOpen} style={sx(`cursor:pointer;height:220px;background:${post.photoBg}`)}>
        <ImageSlot shape="rect" placeholder="รูปโพสต์" src={post.photoSrc} style="width:100%;height:100%" />
      </div>
      <div style={sx("padding:16px;display:flex;flex-direction:column;gap:10px;flex:1")}>
        <div style={sx("display:flex;gap:8px;flex-wrap:wrap")}>
          <span style={sx(`background:${post.categoryColor};color:#201C16;font-weight:700;font-size:11px;padding:5px 12px;border-radius:100px`)}>{post.categoryLabel}</span>
        </div>
        <p onClick={post.onOpen} style={sx("margin:0;font-size:16px;line-height:1.4;font-weight:800;color:#201C16;cursor:pointer")}>{post.title}</p>
        <p style={sx("margin:0;font-size:13px;line-height:1.5;color:#4a453c;flex:1")}>{post.excerpt}</p>
        <div style={sx("display:flex;align-items:center;gap:8px;margin-top:4px")}>
          <div style={sx(`width:24px;height:24px;border-radius:50%;background:${post.authorColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:11px;flex:none;overflow:hidden`)}>{post.authorAvatarSrc ? <ImageSlot shape="circle" placeholder="" src={post.authorAvatarSrc} style="width:100%;height:100%" /> : post.authorInitial}</div>
          <span style={sx("font-size:12px;color:#8a8378;flex:1;min-width:0")}>{post.authorName} · {post.time}</span>
          <button onClick={post.onLike} style={sx(`background:none;border:none;cursor:pointer;font-weight:700;font-size:12px;color:${post.likeColor};display:flex;align-items:center;gap:3px;padding:0`)}>
            <span style={sx(`display:inline-flex;${post.likeAnim}`)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={post.likeFill} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.3 3.5 12C1.6 10 1.8 6.7 4 5c1.9-1.5 4.6-1.2 6.2.6L12 7.5l1.8-1.9c1.6-1.8 4.3-2.1 6.2-.6 2.2 1.7 2.4 5 .5 7L12 20.3z" /></svg>
            </span> {post.likes}
          </button>
          <span style={sx("font-weight:700;font-size:12px;color:#8a8378;display:flex;align-items:center;gap:3px")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.3-3.4A7.9 7.9 0 0 1 4 12z" /></svg> {post.commentCount}
          </span>
        </div>
      </div>
    </Hoverable>
  );
}

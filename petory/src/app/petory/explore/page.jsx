"use client";
import { useEffect, useMemo, useState } from "react";
import { sx, Hoverable } from "../ui";
import { usePetory } from "../context";
import { visiblePosts, mapPost } from "../helpers";
import { CATEGORY_LABELS, BLOG_TITLES } from "../constants";
import Dropdown from "../components/Dropdown";
import ExplorePostCard from "../components/ExplorePostCard";
import { postClient } from "@/features/auth/client";

const CATEGORY_ICONS = { all: "🐾", recipe: "🍲", place: "📍", clinic: "🏥", tips: "💡" };
const SPECIES_LABELS = { all: "ประเภทสัตว์", Dog: "หมา", Cat: "แมว", other: "อื่นๆ" };

function toViewPost(post, accountId) {
  return {
    ...post, authorId: post.authorId === accountId ? "me" : post.authorId, location: post.locationLabel || "", time: "now",
    photoSrc: post.photoMediaId ? `/api/media/${post.photoMediaId}` : undefined,
    likes: post.likes || 0, liked: Boolean(post.liked), saved: Boolean(post.saved), comments: post.comments || [],
  };
}

export default function ExplorePage() {
  const { state: s, ...a } = usePetory();
  const ff = s.feedFilter;
  // Only the order lives here; the posts themselves go into shared state so that
  // liking, saving and commenting act on the same records as the rest of the app.
  const [remoteIds, setRemoteIds] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const absorb = (posts) => {
    const mapped = posts.map((post) => toViewPost(post, s.user.id));
    const incoming = new Set(mapped.map((post) => post.id));
    a.update((s2) => ({
      posts: s2.posts.filter((post) => !incoming.has(post.id)).concat(mapped),
      users: s2.users.concat(mapped
        .filter((post) => post.authorId !== "me" && !s2.users.some((user) => user.id === post.authorId))
        .map((post) => ({ id: post.authorId, name: post.authorName, color: post.authorColor || "#2B5468", bio: "", location: "" }))),
    }));
    return mapped.map((post) => post.id);
  };

  useEffect(() => {
    if (!s.user?.id) return;
    let active = true;
    void postClient.list({ scope: "explore", category: ff.category, species: ff.species, sort: ff.sort, search: ff.search, limit: "20" })
      .then(({ posts, nextCursor: cursor }) => {
        if (!active) return;
        setRemoteIds(absorb(posts));
        setNextCursor(cursor);
      })
      .catch(() => { if (active) setRemoteIds([]); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.user?.id, ff.category, ff.species, ff.sort, ff.search]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { posts, nextCursor: cursor } = await postClient.list({ scope: "explore", category: ff.category, species: ff.species, sort: ff.sort, search: ff.search, cursor: nextCursor, limit: "20" });
      const ids = absorb(posts);
      setRemoteIds((current) => current.concat(ids.filter((id) => !current.includes(id))));
      setNextCursor(cursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const feedState = useMemo(() => {
    const byId = new Map(s.posts.map((post) => [post.id, post]));
    return { ...s, posts: remoteIds.map((id) => byId.get(id)).filter(Boolean) };
  }, [s, remoteIds]);

  const feedPosts = visiblePosts(feedState).map((p) => mapPost(feedState, a, p)).map((p) => ({
    ...p,
    title: p.title || BLOG_TITLES[p.id] || p.caption, excerpt: p.caption,
    authorInitial: p.authorName.charAt(0), likeFill: p.liked ? "#E3402B" : "none",
  }));
  const feedEmpty = s.sessionReady && feedPosts.length === 0;

  const categoryFilters = ["all", "recipe", "place", "clinic", "tips"].map((cat) => ({
    icon: CATEGORY_ICONS[cat], key: cat, label: cat === "all" ? "ทั้งหมด" : CATEGORY_LABELS[cat],
    fg: ff.category === cat ? "#E3402B" : "#201C16", underline: ff.category === cat ? "#E3402B" : "transparent",
    fs: ff.category === cat ? "16px" : "14px",
    pawStyle: ff.category === cat ? "display:inline-block;margin-right:5px;animation:pawPulse 1s ease-in-out infinite" : "display:none",
  }));

  const feedSpeciesLabel = SPECIES_LABELS[ff.species] || "ประเภทสัตว์";
  const feedSpeciesOptions = ["all", "Dog", "Cat", "other"].map((val) => ({
    label: SPECIES_LABELS[val], onSelect: () => a.selectFeedSpecies(val),
    optionStyle: "padding:9px 14px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;" + (val === ff.species ? "background:#FDEDEA;color:#E4412C" : "color:#201C16"),
  }));
  const searchIconStyle = "cursor:pointer;font-size:16px;padding:8px;border-radius:100px;background:transparent;border:none;" + (s.searchOpen ? "display:none" : "");

  return (
    <div style={sx("background-color: #FDFDF4; min-height: calc(100vh - 68px)")}>
      <div style={sx("max-width: 100%; margin: 0 auto; padding: clamp(20px,4vw,48px) clamp(20px,4vw,48px) 120px; padding-left: 80px; padding-right: 80px")}>
        <div style={sx("display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-bottom:28px;padding-bottom:2px")}>
          {categoryFilters.map((c) => (
            <Hoverable key={c.key} as="span" onClick={() => a.setFeedCategory(c.key)} style={`padding-bottom: 12px; font-weight: 800; font-size: ${c.fs}; cursor: pointer; color: ${c.fg}; border-bottom: 3px solid ${c.underline}; margin-bottom: -2px; transition: color 0.15s ease,transform 0.12s ease`} hoverStyle="color:#E3402B" activeStyle="transform:scale(0.92)">
              <span style={sx(c.pawStyle)}>{c.icon}</span>{c.label}
            </Hoverable>
          ))}
          <div style={{ flex: 1 }} />
          <Dropdown
            label={feedSpeciesLabel}
            open={s.speciesDropdownOpen}
            onToggle={a.toggleSpeciesDropdown}
            options={feedSpeciesOptions}
            buttonStyle="padding:9px 16px;border-radius:100px;border:none;font-weight:800;font-size:13px;color:#201C16;cursor:pointer;background:#fff;box-shadow:0 2px 6px rgba(32,28,22,0.1);display:flex;align-items:center;gap:8px"
            panelStyle="position:absolute;top:calc(100% + 6px);left:0;min-width:140px;background:#fff;border-radius:14px;box-shadow:rgba(0,0,0,0.19) 0px 10px 20px, rgba(0,0,0,0.23) 0px 6px 6px;padding:6px;z-index:10;display:flex;flex-direction:column;gap:2px"
          />
          {s.searchOpen && (
            <input placeholder="ค้นหาโพสต์..." value={ff.search} onChange={a.onFeedSearch} onBlur={a.onSearchBlur} autoFocus style={sx("flex: 1; min-width: 140px; max-width: 260px; padding: 9px 16px; border-radius: 100px; border: none; font-size: 13px; background: #FFFCF6; border-style: solid; border-width: 2px; border-color: #E4412C")} />
          )}
          <span onClick={a.toggleSearchOpen} style={sx(searchIconStyle)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#201C16" strokeWidth="2" /><path d="M21 21l-4.35-4.35" stroke="#201C16" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
          <button onClick={a.openCreatePostBlog} style={sx("background:#E3402B;color:#fff;border:none;border-radius:100px;padding:10px 20px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:pointer")}>+ สร้างโพสต์</button>
        </div>
        {feedEmpty && (
          <div style={sx("text-align:center;padding:80px 20px")}>
            <div style={sx("font-family:'Anton',sans-serif;font-size:clamp(1.8rem,5vw,3rem);text-transform:uppercase;margin:0 0 12px")}>Nothing Here Yet.</div>
            <p style={sx("color:#4a453c;font-size:15px")}>เริ่มแบ่งปันเรื่องราวของสัตว์เลี้ยงของคุณ</p>
          </div>
        )}
        <div style={sx("display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px")}>
          {feedPosts.map((post) => <ExplorePostCard key={post.id} post={post} />)}
        </div>
        {nextCursor && <div style={sx("display:flex;justify-content:center;padding:32px 0 8px")}><button onClick={loadMore} disabled={loadingMore} style={sx(`border:2px solid #201C16;background:#fff;color:#201C16;border-radius:100px;padding:12px 24px;font-weight:800;font-size:13px;text-transform:uppercase;cursor:${loadingMore ? "wait" : "pointer"};opacity:${loadingMore ? "0.65" : "1"}`)}>{loadingMore ? "Loading..." : "Load More"}</button></div>}
      </div>
    </div>
  );
}

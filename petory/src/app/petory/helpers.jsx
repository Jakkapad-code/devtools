import { CATEGORY_LABELS, CATEGORY_COLORS, BLOG_TITLES } from "./constants";

const PHOTO_PALETTE = ["#E9C79A", "#D9A15B", "#EDE0C8", "#C7A374", "#D8B48A", "#B0B0AE", "#9CA3A8", "#E3C08A"];
const DEMO_IMAGE_PATHS = [
  "/uploads/demo/mochi-shiba.jpg",
  "/uploads/demo/luna-golden.jpg",
  "/uploads/demo/milo-cat.jpg",
  "/uploads/demo/bella-corgi.jpg",
  "/uploads/demo/buddy-dog.jpg",
];

export function demoPetImage(name, fallbackIndex = 0) {
  const normalizedName = String(name || "").toLowerCase();
  if (["mochi"].includes(normalizedName)) return DEMO_IMAGE_PATHS[0];
  if (["luna"].includes(normalizedName)) return DEMO_IMAGE_PATHS[1];
  if (["milo", "simba", "whiskers", "tom", "coffee", "leo"].includes(normalizedName)) return DEMO_IMAGE_PATHS[2];
  if (["bella", "coco", "daisy"].includes(normalizedName)) return DEMO_IMAGE_PATHS[3];
  return DEMO_IMAGE_PATHS[fallbackIndex % DEMO_IMAGE_PATHS.length];
}

export function demoPostImage(id) {
  const hash = String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DEMO_IMAGE_PATHS[hash % DEMO_IMAGE_PATHS.length];
}

/**
 * One place decides a pet's picture: the uploaded file wins, otherwise a demo
 * image keyed off the pet id. Keying off a list position instead would make the
 * picture change whenever the pet moves in the list.
 */
export function petPhotoSrc(pet) {
  if (pet.photoMediaId) return `/api/media/${pet.photoMediaId}`;
  const stable = Math.abs(String(pet.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return demoPetImage(pet.name, stable);
}

export function shortTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export function daysAgoLabel(value) {
  if (!value) return "";
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  return `${days} วันก่อน`;
}

/** An uploaded file, wherever it is attached, is served from media. */
export function mediaSrc(mediaId) {
  return mediaId ? `/api/media/${mediaId}` : undefined;
}

/** Uploaded avatars are served from media. There is no shared stand-in picture:
 *  an account without a photo falls back to its own initial, so every circle on
 *  screen belongs to that one account. */
export function avatarSrc(mediaId) {
  return mediaSrc(mediaId);
}

/** The letter shown in place of a missing avatar. */
export function avatarInitial(name) {
  return String(name || "?").trim().charAt(0).toUpperCase();
}

export function hashColor(id) {
  return PHOTO_PALETTE[Math.abs(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % PHOTO_PALETTE.length];
}

export function userById(state, id) {
  return state.users.find((u) => u.id === id) || { name: "Unknown", color: "#999" };
}

export function petById(state, id) {
  return state.pets.find((p) => p.id === id);
}

export function visiblePosts(state) {
  return state.posts.filter((p) => state.blockedUserIds.indexOf(p.authorId) === -1);
}

/**
 * Feed order: not-yet-followed posts spread in between the ones you follow.
 * Both streams advance proportionally, so recommendations stay scattered across
 * the whole feed at any ratio instead of piling up once one stream runs out —
 * including a brand new account, whose feed is recommendations only.
 */
export function withRecommended(state, posts) {
  const followed = [];
  const recommended = [];
  posts.forEach((post) => {
    if (post.authorId === "me" || state.followingIds.includes(post.authorId)) followed.push(post);
    else recommended.push(post);
  });

  const ordered = [];
  let f = 0;
  let r = 0;
  while (f < followed.length || r < recommended.length) {
    const followedDone = f / (followed.length || 1);
    const recommendedDone = r / (recommended.length || 1);
    if (f < followed.length && (followedDone <= recommendedDone || r >= recommended.length)) {
      ordered.push(followed[f]);
      f += 1;
    } else {
      ordered.push(recommended[r]);
      r += 1;
    }
  }
  return ordered;
}

export function categoryLabel(post) {
  return CATEGORY_LABELS[post.category] || post.category;
}

export function categoryColor(post) {
  return CATEGORY_COLORS[post.category] || "#EFEAE2";
}

export function postTitle(post) {
  return post.title || BLOG_TITLES[post.id] || post.caption;
}

// Shared per-post view-model used by Home and Explore cards.
export function mapPost(state, actions, p) {
  const author = userById(state, p.authorId);
  const pet = petById(state, p.petId);
  return {
    ...p,
    authorName: author.name, authorColor: hashColor(p.authorId), isMine: p.authorId === "me", notMine: p.authorId !== "me",
    authorInitial: avatarInitial(author.name),
    authorAvatarSrc: avatarSrc(p.authorAvatarMediaId ?? (p.authorId === "me" ? state.user?.avatarMediaId : author.avatarMediaId)),
    petName: pet ? pet.name : null,
    isFollowing: state.followingIds.includes(p.authorId),
    onAuthorClick: () => actions.openUserProfile(p.authorId),
    onFollow: () => actions.toggleFollow(p.authorId),
    categoryLabel: categoryLabel(p), categoryColor: categoryColor(p),
    photoBg: hashColor(p.id), photoSrc: p.photoSrc || pet?.photoSrc || demoPostImage(p.id), imageLabel: pet ? pet.name + " PHOTO" : "POST PHOTO",
    likeColor: p.liked ? "#E3402B" : "#201C16", likeAnim: state.lastLikedId === p.id ? "animation:createPostPop 0.32s ease-out" : "",
    saveColor: p.saved ? "#E3402B" : "#8a8378", saveLabel: p.saved ? "Saved" : "Save",
    commentCount: p.comments.length,
    onLike: () => actions.toggleLike(p.id), onSave: () => actions.toggleSave(p.id), onOpen: () => actions.openPostDetail(p.id), onReport: () => actions.openReportPost(p.id),
    onDelete: () => actions.openDeletePost(p.id), onEdit: () => actions.openEditPost(p.id), onBlock: () => actions.openBlock(p.authorId),
    menuOpen: state.postMenuOpenId === p.id, onMenuToggle: (e) => actions.togglePostMenu(p.id, e),
  };
}

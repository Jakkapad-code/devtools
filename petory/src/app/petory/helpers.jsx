import { CATEGORY_LABELS, BLOG_TITLES } from "./constants";

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

export function categoryLabel(post) {
  return CATEGORY_LABELS[post.category] || post.category;
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
    authorName: author.name, authorColor: author.color, isMine: p.authorId === "me", notMine: p.authorId !== "me",
    petName: pet ? pet.name : null,
    onAuthorClick: () => actions.openUserProfile(p.authorId),
    categoryLabel: categoryLabel(p),
    photoBg: hashColor(p.id), photoSrc: p.photoSrc || pet?.photoSrc || demoPostImage(p.id), imageLabel: pet ? pet.name + " PHOTO" : "POST PHOTO",
    likeColor: p.liked ? "#E3402B" : "#201C16", likeAnim: state.lastLikedId === p.id ? "animation:createPostPop 0.32s ease-out" : "",
    saveColor: p.saved ? "#E3402B" : "#8a8378", saveLabel: p.saved ? "Saved" : "Save",
    commentCount: p.comments.length,
    onLike: () => actions.toggleLike(p.id), onSave: () => actions.toggleSave(p.id), onOpen: () => actions.openPostDetail(p.id), onReport: () => actions.openReportPost(p.id),
    onDelete: () => actions.openDeletePost(p.id), onEdit: () => actions.openEditPost(p.id), onBlock: () => actions.openBlock(p.authorId),
    menuOpen: state.postMenuOpenId === p.id, onMenuToggle: (e) => actions.togglePostMenu(p.id, e),
  };
}

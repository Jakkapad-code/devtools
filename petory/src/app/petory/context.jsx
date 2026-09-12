"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initialState, MUTUAL_CANDIDATES } from "./constants";

const PetoryContext = createContext(null);

export function usePetory() {
  const ctx = useContext(PetoryContext);
  if (!ctx) throw new Error("usePetory must be used within <PetoryProvider>");
  return ctx;
}

export function PetoryProvider({ children }) {
  const [state, setState] = useState(initialState);
  const router = useRouter();
  const toastTimer = useRef(null);
  const s = state;

  const update = (patch) => setState((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));

  useEffect(() => {
    update({ isMobile: window.innerWidth < 860 });
    const onResize = () => update({ isMobile: window.innerWidth < 860 });
    window.addEventListener("resize", onResize);
    const onDocClick = () => update((s2) => (s2.postMenuOpenId ? { postMenuOpenId: null } : {}));
    document.addEventListener("click", onDocClick);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    update({ toast: msg });
    toastTimer.current = setTimeout(() => update({ toast: null }), 2200);
  };

  // ---- simple page navigation ----
  const goHome = () => router.push("/petory/home");
  const goExplore = () => router.push("/petory/explore");
  const goMatching = () => router.push("/petory/matching");
  const goMessages = () => router.push("/petory/messages");
  const goMyPets = () => router.push("/petory/pets");
  const goProfile = () => router.push("/petory/profile");
  const goFollowing = () => router.push("/petory/following");
  const goSettings = () => router.push("/petory/settings");
  const goNotifications = () => {
    update((s2) => ({ notifications: s2.notifications.map((n) => ({ ...n, read: true })) }));
    router.push("/petory/notifications");
  };

  // ---- auth ----
  const onLoginEmail = (e) => update((s2) => ({ loginForm: { ...s2.loginForm, email: e.target.value } }));
  const onLoginPassword = (e) => update((s2) => ({ loginForm: { ...s2.loginForm, password: e.target.value } }));
  const onRegName = (e) => update((s2) => ({ registerForm: { ...s2.registerForm, name: e.target.value } }));
  const onRegEmail = (e) => update((s2) => ({ registerForm: { ...s2.registerForm, email: e.target.value } }));
  const onRegPassword = (e) => update((s2) => ({ registerForm: { ...s2.registerForm, password: e.target.value } }));
  const onRegConfirm = (e) => update((s2) => ({ registerForm: { ...s2.registerForm, confirm: e.target.value } }));

  const login = () => { update({ user: true }); showToast("เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ"); router.push("/petory/home"); };
  const loginBtnClick = () => { update({ loginBtnPop: true }); setTimeout(() => { update({ loginBtnPop: false }); login(); }, 280); };
  const register = () => { update({ user: true }); router.push("/petory/onboarding"); };
  const sendResetLink = () => { showToast("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว"); router.push("/petory/login"); };

  const openLogoutConfirm = () => update((s2) => ({ modals: { ...s2.modals, logoutConfirm: true } }));
  const closeLogoutConfirm = () => update((s2) => ({ modals: { ...s2.modals, logoutConfirm: false } }));
  const confirmLogout = () => { update((s2) => ({ user: null, modals: { ...s2.modals, logoutConfirm: false } })); router.push("/petory/login"); };

  // ---- explore / feed filters ----
  const toggleSpeciesDropdown = () => update((s2) => ({ speciesDropdownOpen: !s2.speciesDropdownOpen }));
  const selectFeedSpecies = (v2) => update((s2) => ({ feedFilter: { ...s2.feedFilter, species: v2 }, speciesDropdownOpen: false }));
  const onFeedSearch = (e) => update((s2) => ({ feedFilter: { ...s2.feedFilter, search: e.target.value } }));
  const toggleSearchOpen = () => update((s2) => ({ searchOpen: !s2.searchOpen }));
  const onSearchBlur = () => { if (!s.feedFilter.search) update({ searchOpen: false }); };
  const setFeedCategory = (cat) => update((s2) => ({ feedFilter: { ...s2.feedFilter, category: cat } }));

  // ---- posts ----
  const toggleLike = (id) => {
    update((s2) => ({ posts: s2.posts.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)), lastLikedId: id }));
    setTimeout(() => update((s2) => (s2.lastLikedId === id ? { lastLikedId: null } : {})), 350);
  };
  const toggleComments = (id) => update((s2) => ({ openComments: s2.openComments.includes(id) ? s2.openComments.filter((x) => x !== id) : s2.openComments.concat([id]) }));
  const onCommentDraft = (id, e) => { const val = e.target.value; update((s2) => ({ commentDrafts: { ...s2.commentDrafts, [id]: val } })); };
  const submitComment = (id) => {
    const text = (s.commentDrafts[id] || "").trim();
    if (!text) return;
    update((s2) => ({
      posts: s2.posts.map((p) => (p.id === id ? { ...p, comments: p.comments.concat([{ user: "Jane Rivera", color: "#E3402B", text }]) } : p)),
      commentDrafts: { ...s2.commentDrafts, [id]: "" },
    }));
  };
  const toggleSave = (id) => {
    let saved;
    update((s2) => ({ posts: s2.posts.map((p) => { if (p.id === id) { saved = !p.saved; return { ...p, saved }; } return p; }) }));
    setTimeout(() => showToast(saved ? "บันทึกโพสต์แล้ว" : "เอาออกจากบันทึกแล้ว"), 0);
  };
  const openPostDetail = (id) => router.push(`/petory/post/${id}`);

  const openUserProfile = (userId) => {
    if (userId === "me") { goProfile(); return; }
    router.push(`/petory/users/${userId}`);
  };
  const toggleFollow = (userId) => {
    const willFollow = !s.followingIds.includes(userId);
    update((s2) => ({ followingIds: s2.followingIds.includes(userId) ? s2.followingIds.filter((id) => id !== userId) : s2.followingIds.concat([userId]) }));
    const u = s.users.find((x) => x.id === userId);
    showToast((willFollow ? "ติดตาม " : "เลิกติดตาม ") + (u ? u.name : "") + (willFollow ? " แล้ว" : ""));
  };
  const unfollowUser = (userId) => { update((s2) => ({ followingIds: s2.followingIds.filter((id) => id !== userId) })); showToast("เลิกติดตามแล้ว"); };

  // ---- create / edit post modal ----
  const openCreatePost = (isBlog) => update((s2) => ({ modals: { ...s2.modals, createPost: true }, postFormIsBlog: !!isBlog, editingPostId: null, postForm: { caption: "", petId: "", category: isBlog ? "tips" : "story", location: "", title: "" } }));
  const openCreatePostBlog = () => openCreatePost(true);
  const openEditPost = (id) => {
    const p = s.posts.find((pp) => pp.id === id);
    if (!p) return;
    update((s2) => ({ modals: { ...s2.modals, createPost: true }, postFormIsBlog: p.category !== "story", editingPostId: id, postMenuOpenId: null, postForm: { caption: p.caption, petId: p.petId || "", category: p.category, location: p.location || "", title: p.title || "" } }));
  };
  const togglePostMenu = (id, e) => { if (e) e.stopPropagation(); update((s2) => ({ postMenuOpenId: s2.postMenuOpenId === id ? null : id })); };
  const openDeletePost = (id) => update((s2) => ({ modals: { ...s2.modals, deletePost: true }, deletePostId: id, postMenuOpenId: null }));
  const closeDeletePost = () => update((s2) => ({ modals: { ...s2.modals, deletePost: false } }));
  const confirmDeletePost = () => {
    const id = s.deletePostId;
    update((s2) => ({ posts: s2.posts.filter((p) => p.id !== id), modals: { ...s2.modals, deletePost: false } }));
    showToast("ลบโพสต์แล้ว");
    router.push("/petory/explore");
  };
  const onCreatePostBtnClick = () => { update({ createPostBtnPop: true }); setTimeout(() => { update({ createPostBtnPop: false }); openCreatePost(false); }, 280); };
  const closeCreatePost = () => update((s2) => ({ modals: { ...s2.modals, createPost: false } }));
  const onPostCaption = (e) => update((s2) => ({ postForm: { ...s2.postForm, caption: e.target.value } }));
  const onPostTitle = (e) => update((s2) => ({ postForm: { ...s2.postForm, title: e.target.value } }));
  const selectPostPet = (id) => update((s2) => ({ postForm: { ...s2.postForm, petId: id }, fieldDropdownOpen: null }));
  const togglePostPetDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "postPet" ? null : "postPet" }));
  const submitPost = () => {
    const f = s.postForm;
    if (!f.caption.trim()) { showToast("กรุณาเขียนแคปชั่นก่อนโพสต์"); return; }
    const editId = s.editingPostId;
    if (editId) {
      update((s2) => ({
        posts: s2.posts.map((p) => (p.id === editId ? { ...p, caption: f.caption, petId: f.petId || null, category: f.category, location: f.location, title: f.title || null } : p)),
        modals: { ...s2.modals, createPost: false }, editingPostId: null,
      }));
      showToast("บันทึกการแก้ไขแล้ว");
      return;
    }
    const newPost = { id: "p" + Date.now(), category: f.category, petId: f.petId || null, authorId: "me", caption: f.caption, title: f.title || null, likes: 0, liked: false, saved: false, comments: [], time: "now" };
    const isBlog = s.postFormIsBlog;
    update((s2) => ({ posts: [newPost].concat(s2.posts), modals: { ...s2.modals, createPost: false } }));
    showToast("โพสต์เรียบร้อยแล้ว!");
    router.push(isBlog ? "/petory/explore" : "/petory/home");
  };

  // ---- pets ----
  const openPetProfile = (id) => router.push(`/petory/pets/${id}`);
  const onPetName = (e) => update((s2) => ({ petForm: { ...s2.petForm, name: e.target.value } }));
  const toggleSpeciesFieldDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "species" ? null : "species" }));
  const toggleGenderFieldDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "gender" ? null : "gender" }));
  const toggleSizeFieldDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "size" ? null : "size" }));
  const selectPetSpecies = (v2) => update((s2) => ({ petForm: { ...s2.petForm, species: v2 }, fieldDropdownOpen: null }));
  const selectPetGender = (v2) => update((s2) => ({ petForm: { ...s2.petForm, gender: v2 }, fieldDropdownOpen: null }));
  const selectPetSize = (v2) => update((s2) => ({ petForm: { ...s2.petForm, size: v2 }, fieldDropdownOpen: null }));
  const onPetBreed = (e) => update((s2) => ({ petForm: { ...s2.petForm, breed: e.target.value } }));
  const onPetAge = (e) => update((s2) => ({ petForm: { ...s2.petForm, age: e.target.value } }));
  const onPetBio = (e) => update((s2) => ({ petForm: { ...s2.petForm, bio: e.target.value } }));
  const onPetInterests = (e) => update((s2) => ({ petForm: { ...s2.petForm, interestsRaw: e.target.value } }));
  const togglePetPersonality = (label) => update((s2) => {
    const has = s2.petForm.personality.includes(label);
    const personality = has ? s2.petForm.personality.filter((p) => p !== label) : s2.petForm.personality.concat([label]);
    return { petForm: { ...s2.petForm, personality } };
  });
  const goAddPet = () => {
    update({ petForm: { id: null, name: "", species: "Dog", breed: "", age: "", gender: "Male", size: "Medium", personality: [], bio: "", interestsRaw: "" } });
    router.push("/petory/pets/new");
  };
  const editPet = (id) => {
    const pet = s.pets.find((p) => p.id === id);
    update({ petForm: { id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, age: String(pet.age), gender: pet.gender, size: pet.size, personality: pet.personality.slice(), bio: pet.bio, interestsRaw: pet.interests.join(", ") } });
    router.push(`/petory/pets/${id}/edit`);
  };
  const cancelPetForm = () => router.push(s.petForm.id ? `/petory/pets/${s.petForm.id}` : "/petory/pets");
  const savePet = () => {
    const f = s.petForm;
    if (!f.name.trim()) { showToast("กรุณากรอกชื่อสัตว์เลี้ยง"); return; }
    const interests = f.interestsRaw.split(",").map((x) => x.trim()).filter(Boolean);
    if (f.id) {
      update((s2) => ({ pets: s2.pets.map((p) => (p.id === f.id ? { ...p, name: f.name.toUpperCase(), species: f.species, breed: f.breed, age: Number(f.age) || p.age, gender: f.gender, size: f.size, personality: f.personality, bio: f.bio, interests } : p)) }));
      showToast("บันทึกการแก้ไขแล้ว");
      router.push(`/petory/pets/${f.id}`);
    } else {
      const id = "pet" + Date.now();
      const photos = ["#E9C79A", "#D9A15B", "#B0B0AE", "#EDE0C8", "#C7A374"];
      const newPet = { id, ownerId: "me", name: f.name.toUpperCase(), species: f.species, breed: f.breed, age: Number(f.age) || 1, gender: f.gender, size: f.size, personality: f.personality, bio: f.bio, interests, distance: 0, photo: photos[Math.floor(Math.random() * photos.length)] };
      update((s2) => ({ pets: s2.pets.concat([newPet]) }));
      showToast("เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว!");
      router.push("/petory/pets");
    }
  };
  const openDeletePet = (id) => update((s2) => ({ modals: { ...s2.modals, deletePet: true }, deletePetId: id || s2.petForm.id }));
  const closeDeletePet = () => update((s2) => ({ modals: { ...s2.modals, deletePet: false } }));
  const confirmDeletePet = () => {
    const id = s.deletePetId;
    update((s2) => ({ pets: s2.pets.filter((p) => p.id !== id), modals: { ...s2.modals, deletePet: false } }));
    showToast("ลบสัตว์เลี้ยงแล้ว");
    router.push("/petory/pets");
  };

  // ---- matching ----
  const openMatchFilter = () => update((s2) => ({ modals: { ...s2.modals, matchFilter: true } }));
  const closeMatchFilter = () => update((s2) => ({ modals: { ...s2.modals, matchFilter: false } }));
  const togglePetDropdown = () => update((s2) => ({ petDropdownOpen: !s2.petDropdownOpen }));
  const selectMatchingPet = (id) => update({ matchingPetId: id, petDropdownOpen: false });
  const setMatchingPurpose = (v2) => update({ matchingPurpose: v2 });
  const resetMatchFilter = () => update({ matchFilters: { species: "all", distance: "anywhere", gender: "any", size: "all", personality: [] } });
  const setMatchFilter = (key, value) => update((s2) => ({ matchFilters: { ...s2.matchFilters, [key]: value } }));
  const toggleMatchPersonalityFilter = (label) => update((s2) => {
    const has = s2.matchFilters.personality.includes(label);
    const personality = has ? s2.matchFilters.personality.filter((p) => p !== label) : s2.matchFilters.personality.concat([label]);
    return { matchFilters: { ...s2.matchFilters, personality } };
  });
  const passPet = (id) => update((s2) => ({ passedPetIds: s2.passedPetIds.concat([id]), lastPassedId: id }));
  const interestPet = (id) => {
    if (MUTUAL_CANDIDATES.indexOf(id) !== -1) {
      const matchId = "m" + Date.now();
      update((s2) => ({
        interestedPetIds: s2.interestedPetIds.concat([id]),
        matches: s2.matches.concat([{ id: matchId, petId: id, matchedAt: "วันนี้", updatedAt: Date.now(), messages: [] }]),
        newMatchPetId: id,
        modals: { ...s2.modals, mutualMatch: true },
      }));
    } else {
      update((s2) => ({ interestedPetIds: s2.interestedPetIds.concat([id]) }));
      showToast("ส่งความสนใจแล้ว รอการตอบรับ");
    }
  };
  const closeMutualMatch = () => update((s2) => ({ modals: { ...s2.modals, mutualMatch: false }, newMatchPetId: null }));
  const startChatFromModal = () => {
    const petId = s.newMatchPetId;
    const match = s.matches.slice().reverse().find((m) => m.petId === petId);
    update((s2) => ({ modals: { ...s2.modals, mutualMatch: false }, newMatchPetId: null }));
    router.push(match ? `/petory/messages/${match.id}` : "/petory/messages");
  };

  // ---- messages ----
  const openChat = (matchId) => router.push(`/petory/messages/${matchId}`);
  const unmatch = (matchId) => {
    update((s2) => ({ matches: s2.matches.filter((m) => m.id !== matchId) }));
    showToast("ยกเลิกการ Match แล้ว");
    router.push("/petory/messages");
  };
  const onChatDraft = (e) => update({ chatDraft: e.target.value });
  const sendMessage = (matchId) => {
    const text = s.chatDraft.trim();
    if (!text) return;
    const nowTime = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    update((s2) => ({
      matches: s2.matches.map((m) => (m.id === matchId ? { ...m, messages: m.messages.concat([{ from: "me", text, time: nowTime() }]), matchedAt: "วันนี้", updatedAt: Date.now() } : m)),
      chatDraft: "",
    }));
    setTimeout(() => {
      const replies = ["เยี่ยมเลย!", "โอเคค่ะ นัดวันไหนดี", "555 น่ารักจัง", "สุดสัปดาห์นี้สะดวกไหม"];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      update((s2) => ({ matches: s2.matches.map((m) => (m.id === matchId ? { ...m, messages: m.messages.concat([{ from: "them", text: reply, time: nowTime() }]), updatedAt: Date.now() } : m)) }));
    }, 1300);
  };
  const onChatKeyDown = (matchId) => (e) => { if (e.key === "Enter") sendMessage(matchId); };

  // ---- reports / blocking ----
  const openReportUser = (userId) => update((s2) => ({ modals: { ...s2.modals, reportUser: true }, reportTargetType: "user", reportTargetId: userId, reportReason: "" }));
  const closeReportUser = () => update((s2) => ({ modals: { ...s2.modals, reportUser: false } }));
  const openReportPost = (postId) => update((s2) => ({ modals: { ...s2.modals, reportPost: true }, reportTargetType: "post", reportTargetId: postId, reportReason: "", postMenuOpenId: null }));
  const closeReportPost = () => update((s2) => ({ modals: { ...s2.modals, reportPost: false } }));
  const setReportReason = (r) => update({ reportReason: r });
  const submitReport = () => {
    if (!s.reportReason) return;
    update((s2) => ({ modals: { ...s2.modals, reportUser: false, reportPost: false } }));
    showToast("ขอบคุณสำหรับรายงาน เราจะตรวจสอบโดยเร็ว");
  };
  const unblockUser = (userId) => { update((s2) => ({ blockedUserIds: s2.blockedUserIds.filter((id) => id !== userId) })); showToast("ปลดบล็อกผู้ใช้แล้ว"); };
  const openBlock = (userId) => update((s2) => ({ modals: { ...s2.modals, block: true }, blockTargetUserId: userId, postMenuOpenId: null }));
  const closeBlock = () => update((s2) => ({ modals: { ...s2.modals, block: false } }));
  const confirmBlock = () => {
    const uid = s.blockTargetUserId;
    update((s2) => ({ blockedUserIds: s2.blockedUserIds.concat([uid]), modals: { ...s2.modals, block: false } }));
    showToast("บล็อกผู้ใช้แล้ว");
  };

  // ---- my profile ----
  const goEditProfile = () => {
    const me = s.users.find((u) => u.id === "me");
    update((s2) => ({ profileForm: { name: me.name, location: me.location, bio: me.bio, phone: me.phone, email: me.email }, modals: { ...s2.modals, editProfile: true } }));
  };
  const closeEditProfile = () => update((s2) => ({ modals: { ...s2.modals, editProfile: false } }));
  const onProfileName = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, name: e.target.value } }));
  const onProfileLocation = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, location: e.target.value } }));
  const onProfilePhone = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, phone: e.target.value } }));
  const onProfileEmail = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, email: e.target.value } }));
  const onProfileBio = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, bio: e.target.value } }));
  const saveProfile = () => {
    const f = s.profileForm;
    update((s2) => ({ users: s2.users.map((u) => (u.id === "me" ? { ...u, name: f.name, location: f.location, bio: f.bio, phone: f.phone, email: f.email } : u)), modals: { ...s2.modals, editProfile: false } }));
    showToast("บันทึกโปรไฟล์แล้ว");
  };

  const value = {
    state, update, showToast,
    goHome, goExplore, goMatching, goMessages, goMyPets, goProfile, goFollowing, goSettings, goNotifications,
    onLoginEmail, onLoginPassword, onRegName, onRegEmail, onRegPassword, onRegConfirm,
    login, loginBtnClick, register, sendResetLink,
    openLogoutConfirm, closeLogoutConfirm, confirmLogout,
    toggleSpeciesDropdown, selectFeedSpecies, onFeedSearch, toggleSearchOpen, onSearchBlur, setFeedCategory,
    toggleLike, toggleComments, onCommentDraft, submitComment, toggleSave, openPostDetail,
    openUserProfile, toggleFollow, unfollowUser,
    openCreatePost, openCreatePostBlog, openEditPost, togglePostMenu, openDeletePost, closeDeletePost, confirmDeletePost,
    onCreatePostBtnClick, closeCreatePost, onPostCaption, onPostTitle, selectPostPet, togglePostPetDropdown, submitPost,
    openPetProfile, onPetName, toggleSpeciesFieldDropdown, toggleGenderFieldDropdown, toggleSizeFieldDropdown,
    selectPetSpecies, selectPetGender, selectPetSize, onPetBreed, onPetAge, onPetBio, onPetInterests, togglePetPersonality,
    goAddPet, editPet, cancelPetForm, savePet, openDeletePet, closeDeletePet, confirmDeletePet,
    openMatchFilter, closeMatchFilter, togglePetDropdown, selectMatchingPet, setMatchingPurpose, resetMatchFilter, setMatchFilter, toggleMatchPersonalityFilter,
    passPet, interestPet, closeMutualMatch, startChatFromModal,
    openChat, unmatch, onChatDraft, onChatKeyDown, sendMessage,
    openReportUser, closeReportUser, openReportPost, closeReportPost, setReportReason, submitReport,
    unblockUser, openBlock, closeBlock, confirmBlock,
    goEditProfile, closeEditProfile, onProfileName, onProfileLocation, onProfilePhone, onProfileEmail, onProfileBio, saveProfile,
  };

  return <PetoryContext.Provider value={value}>{children}</PetoryContext.Provider>;
}

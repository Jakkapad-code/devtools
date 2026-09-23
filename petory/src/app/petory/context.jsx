"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initialState } from "./constants";
import { petPhotoSrc } from "./helpers";
import { authClient, matchingClient, mediaClient, petClient, postClient, socialClient } from "@/features/auth/client";

const PetoryContext = createContext(null);

const PET_COLORS = ["#E9C79A", "#D9A15B", "#B0B0AE", "#EDE0C8", "#C7A374"];
const REMEMBER_EMAIL_KEY = "petory_remember_email";

function toPetView(pet, index = 0) {
  return {
    ...pet,
    ownerId: "me",
    photo: PET_COLORS[index % PET_COLORS.length],
    photoSrc: petPhotoSrc(pet),
    distance: 0,
  };
}

function toPostView(post, currentAccountId) {
  return {
    ...post,
    authorId: post.authorId === currentAccountId ? "me" : post.authorId,
    location: post.locationLabel || "",
    photoSrc: post.photoMediaId ? `/api/media/${post.photoMediaId}` : undefined,
    likes: post.likes || 0,
    liked: Boolean(post.liked),
    saved: Boolean(post.saved),
    comments: post.comments || [],
    time: "now",
  };
}

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
    const syncViewport = () => {
      update((s2) => {
        const isMobile = window.innerWidth < 860;
        return s2.isMobile === isMobile ? {} : { isMobile };
      });
    };
    const animationFrame = window.requestAnimationFrame(syncViewport);
    const onResize = () => update({ isMobile: window.innerWidth < 860 });
    window.addEventListener("resize", onResize);
    // React delegates clicks on the document too, so stopPropagation in the toggle
    // cannot block this listener; skip clicks that came from the menu itself.
    const onDocClick = (event) => {
      if (event.target.closest?.("[data-post-menu]")) return;
      update((s2) => (s2.postMenuOpenId ? { postMenuOpenId: null } : {}));
    };
    document.addEventListener("click", onDocClick);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  const applyAccount = (account) => setState((previous) => ({
    ...previous,
    user: account,
    // The purpose lives on the account, so a sign-in on another device keeps it.
    matchingPurpose: account.matchingPurpose ?? previous.matchingPurpose,
    users: previous.users.map((user) => user.id === "me" ? {
      ...user,
      name: account.display_name,
      email: account.email,
      bio: account.bio || "",
      phone: account.phone || "",
      location: account.location_label || "",
      memberSince: new Date(account.created_at).getFullYear().toString(),
    } : user),
  }));

  /** Replaces the placeholder feed with this account's real data. */
  const loadAccountData = async (account, isActive = () => true) => {
    const [{ pets }, { posts }, { users: following }, { users: suggested }] = await Promise.all([
      petClient.list(), postClient.list(), socialClient.following(), socialClient.suggested(),
    ]);
    if (!isActive()) return;
    setState((previous) => ({
      ...previous,
      pets: previous.pets.filter((pet) => pet.ownerId !== "me").concat(pets.map(toPetView)),
      posts: posts.map((post) => toPostView(post, account.id)),
      users: previous.users.concat(posts
        .filter((post) => post.authorId !== account.id && !previous.users.some((user) => user.id === post.authorId))
        .map((post) => ({ id: post.authorId, name: post.authorName, color: post.authorColor || "#2B5468", bio: "", location: "" }))),
      followingIds: following.map((user) => user.id),
      suggestedUsers: suggested,
    }));
  };

  useEffect(() => {
    let active = true;

    void authClient.me()
      .then(async (payload) => {
        if (!active || !payload) return;
        applyAccount(payload.account);
        await loadAccountData(payload.account, () => active);
      })
      .catch(() => {
        // A failed hydration must not prevent a visitor from using public pages.
      })
      .finally(() => {
        if (active) setState((previous) => ({ ...previous, sessionReady: true }));
      });

    return () => {
      active = false;
    };
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
  const goFollowers = () => router.push("/petory/followers");
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

  const onToggleRemember = (e) => {
    const rememberMe = e.target.checked;
    update({ rememberMe });
  };

  /** Only the email is kept, never the password. */
  const loadRememberedEmail = () => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) update((s2) => ({ loginForm: { ...s2.loginForm, email: saved }, rememberMe: true }));
    } catch {
      // Storage can be blocked; the form simply starts empty.
    }
  };

  const goForgot = () => router.push("/petory/forgot");
  const login = async () => {
    update({ authPending: true, authError: null });
    try {
      const { account } = await authClient.login(s.loginForm.email, s.loginForm.password);
      try {
        if (s.rememberMe) window.localStorage.setItem(REMEMBER_EMAIL_KEY, s.loginForm.email);
        else window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
      } catch {
        // Storage can be blocked; sign-in should still succeed.
      }
      applyAccount(account);
      await loadAccountData(account).catch(() => {});
      showToast("เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ");
      router.push("/petory/home");
    } catch (error) {
      update({ authError: error.message });
    } finally {
      update({ authPending: false });
    }
  };
  const loginBtnClick = () => {
    if (s.authPending) return;
    update({ loginBtnPop: true });
    setTimeout(() => {
      update({ loginBtnPop: false });
      void login();
    }, 280);
  };
  const register = async () => {
    if (s.authPending) return;
    if (s.registerForm.password !== s.registerForm.confirm) {
      update({ authError: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน" });
      return;
    }

    update({ authPending: true, authError: null });
    try {
      const { account } = await authClient.register(s.registerForm.name, s.registerForm.email, s.registerForm.password);
      applyAccount(account);
      await loadAccountData(account).catch(() => {});
      router.push("/petory/onboarding");
    } catch (error) {
      update({ authError: error.message });
    } finally {
      update({ authPending: false });
    }
  };
  const sendResetLink = () => { showToast("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว"); router.push("/petory/login"); };

  const openLogoutConfirm = () => update((s2) => ({ modals: { ...s2.modals, logoutConfirm: true } }));
  const closeLogoutConfirm = () => update((s2) => ({ modals: { ...s2.modals, logoutConfirm: false } }));
  const confirmLogout = async () => {
    try {
      await authClient.logout();
      update((s2) => ({ user: null, modals: { ...s2.modals, logoutConfirm: false } }));
      router.push("/petory/login");
    } catch (error) {
      showToast(error.message);
    }
  };

  // ---- explore / feed filters ----
  const toggleSpeciesDropdown = () => update((s2) => ({ speciesDropdownOpen: !s2.speciesDropdownOpen }));
  const selectFeedSpecies = (v2) => update((s2) => ({ feedFilter: { ...s2.feedFilter, species: v2 }, speciesDropdownOpen: false }));
  const onFeedSearch = (e) => update((s2) => ({ feedFilter: { ...s2.feedFilter, search: e.target.value } }));
  const toggleSearchOpen = () => update((s2) => ({ searchOpen: !s2.searchOpen }));
  const onSearchBlur = () => { if (!s.feedFilter.search) update({ searchOpen: false }); };
  const setFeedCategory = (cat) => update((s2) => ({ feedFilter: { ...s2.feedFilter, category: cat } }));

  const loadHomeFeed = async (category) => {
    if (!s.user?.id) return;
    try {
      const { posts } = await postClient.list({ scope: "home", category, sort: "latest", limit: "20" });
      update((s2) => ({
        posts: posts.map((post) => toPostView(post, s.user.id)),
        users: s2.users.concat(posts
          .filter((post) => post.authorId !== s.user.id && !s2.users.some((user) => user.id === post.authorId))
          .map((post) => ({ id: post.authorId, name: post.authorName, color: post.authorColor || "#2B5468", bio: "", location: "" }))),
      }));
    } catch (error) {
      showToast(error.message);
    }
  };

  // ---- posts ----
  const toggleLike = async (id) => {
    const post = s.posts.find((item) => item.id === id);
    if (!post) return;
    try {
      const { post: result } = await postClient.setLike(id, !post.liked);
      update((s2) => ({ posts: s2.posts.map((item) => item.id === id ? { ...item, liked: result.liked, likes: result.likes } : item), lastLikedId: id }));
      setTimeout(() => update((s2) => (s2.lastLikedId === id ? { lastLikedId: null } : {})), 350);
    } catch (error) {
      showToast(error.message);
    }
  };
  const toggleComments = (id) => update((s2) => ({ openComments: s2.openComments.includes(id) ? s2.openComments.filter((x) => x !== id) : s2.openComments.concat([id]) }));
  const onCommentDraft = (id, e) => { const val = e.target.value; update((s2) => ({ commentDrafts: { ...s2.commentDrafts, [id]: val } })); };
  const submitComment = async (id) => {
    const text = (s.commentDrafts[id] || "").trim();
    if (!text) return;
    try {
      const { comment } = await postClient.addComment(id, text);
      update((s2) => ({ posts: s2.posts.map((p) => p.id === id ? { ...p, comments: p.comments.concat([comment]) } : p), commentDrafts: { ...s2.commentDrafts, [id]: "" } }));
    } catch (error) {
      showToast(error.message);
    }
  };
  const toggleSave = async (id) => {
    const post = s.posts.find((item) => item.id === id);
    if (!post) return;
    try {
      const { post: result } = await postClient.setSave(id, !post.saved);
      update((s2) => ({ posts: s2.posts.map((item) => item.id === id ? { ...item, saved: result.saved } : item) }));
      showToast(result.saved ? "บันทึกโพสต์แล้ว" : "เอาออกจากบันทึกแล้ว");
    } catch (error) {
      showToast(error.message);
    }
  };
  const openPostDetail = (id) => router.push(`/petory/post/${id}`);

  const openUserProfile = (userId) => {
    if (userId === "me") { goProfile(); return; }
    router.push(`/petory/users/${userId}`);
  };
  const toggleFollow = async (userId) => {
    if (!/^[0-9a-f-]{36}$/i.test(userId)) { showToast("ผู้ใช้นี้ยังเป็นข้อมูลตัวอย่าง"); return; }
    const willFollow = !s.followingIds.includes(userId);
    try {
      await socialClient.setFollow(userId, willFollow);
      update((s2) => ({
        followingIds: willFollow ? s2.followingIds.concat([userId]) : s2.followingIds.filter((id) => id !== userId),
        suggestedUsers: willFollow ? s2.suggestedUsers.filter((u) => u.id !== userId) : s2.suggestedUsers,
        user: s2.user ? { ...s2.user, followingCount: (s2.user.followingCount || 0) + (willFollow ? 1 : -1) } : s2.user,
      }));
      showToast(willFollow ? "ติดตามแล้ว" : "เลิกติดตามแล้ว");
    } catch (error) { showToast(error.message); }
  };
  const unfollowUser = (userId) => toggleFollow(userId);

  // ---- create / edit post modal ----
  const openCreatePost = (isBlog) => update((s2) => ({ modals: { ...s2.modals, createPost: true }, postFormIsBlog: !!isBlog, editingPostId: null, postForm: { caption: "", petId: "", category: isBlog ? "tips" : "story", location: "", title: "", photoMediaId: null } }));
  const openCreatePostBlog = () => openCreatePost(true);
  const openEditPost = (id) => {
    const p = s.posts.find((pp) => pp.id === id);
    if (!p) return;
    update((s2) => ({ modals: { ...s2.modals, createPost: true }, postFormIsBlog: p.category !== "story", editingPostId: id, postMenuOpenId: null, postForm: { caption: p.caption, petId: p.petId || "", category: p.category, location: p.location || "", title: p.title || "", photoMediaId: p.photoMediaId ?? null } }));
  };
  const togglePostMenu = (id, e) => { if (e) e.stopPropagation(); update((s2) => ({ postMenuOpenId: s2.postMenuOpenId === id ? null : id })); };
  const openDeletePost = (id) => update((s2) => ({ modals: { ...s2.modals, deletePost: true }, deletePostId: id, postMenuOpenId: null }));
  const closeDeletePost = () => update((s2) => ({ modals: { ...s2.modals, deletePost: false } }));
  const confirmDeletePost = async () => {
    const id = s.deletePostId;
    if (!id) return;
    update({ postPending: true });
    try {
      await postClient.remove(id);
      update((s2) => ({ posts: s2.posts.filter((p) => p.id !== id), modals: { ...s2.modals, deletePost: false } }));
      showToast("ลบโพสต์แล้ว");
      router.push("/petory/explore");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ postPending: false });
    }
  };
  const onCreatePostBtnClick = () => { update({ createPostBtnPop: true }); setTimeout(() => { update({ createPostBtnPop: false }); openCreatePost(false); }, 280); };
  const closeCreatePost = () => update((s2) => ({ modals: { ...s2.modals, createPost: false } }));
  const onPostCaption = (e) => update((s2) => ({ postForm: { ...s2.postForm, caption: e.target.value } }));
  const onPostTitle = (e) => update((s2) => ({ postForm: { ...s2.postForm, title: e.target.value } }));
  // Where a post lands is decided by the composer it was opened from, not by the
  // category: a Home post stays on Home, and the category only labels it.
  const selectPostCategory = (category) => update((s2) => ({
    postForm: { ...s2.postForm, category },
    fieldDropdownOpen: null,
  }));
  const togglePostCategoryDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "postCategory" ? null : "postCategory" }));
  /** Picking a file opens the adjuster; the upload happens on confirm. */
  const pickImage = (target, aspect) => (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) update({ pendingImage: { file, target, aspect } });
  };
  const cancelImageAdjust = () => update({ pendingImage: null });

  const uploadPostPhoto = pickImage("post", 16 / 9);

  const confirmImageAdjust = async (file) => {
    const target = s.pendingImage?.target;
    if (!target) return;
    update({ pendingImage: null, [`${target}PhotoPending`]: true });
    try {
      if (target === "avatar") {
        const { mediaId } = await mediaClient.uploadAvatar(file);
        update((s2) => ({
          user: { ...s2.user, avatarMediaId: mediaId },
          users: s2.users.map((user) => user.id === "me" ? { ...user, avatarMediaId: mediaId } : user),
        }));
        showToast("อัปโหลดรูปโปรไฟล์แล้ว");
        return;
      }
      const { mediaId } = await mediaClient.upload(file);
      const formKey = target === "post" ? "postForm" : "petForm";
      update((s2) => ({ [formKey]: { ...s2[formKey], photoMediaId: mediaId } }));
      showToast("อัปโหลดรูปแล้ว");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ [`${target}PhotoPending`]: false });
    }
  };
  const selectPostPet = (id) => update((s2) => ({ postForm: { ...s2.postForm, petId: id }, fieldDropdownOpen: null }));
  const togglePostPetDropdown = () => update((s2) => ({ fieldDropdownOpen: s2.fieldDropdownOpen === "postPet" ? null : "postPet" }));
  const submitPost = async () => {
    const f = s.postForm;
    if (!f.caption.trim()) { showToast("กรุณาเขียนแคปชั่นก่อนโพสต์"); return; }
    const editId = s.editingPostId;
    const input = { category: f.category, caption: f.caption.trim(), title: f.title.trim(), locationLabel: f.location.trim(), petId: f.petId || null, photoMediaId: f.photoMediaId };
    const isBlog = s.postFormIsBlog;
    update({ postPending: true });
    try {
      const response = editId ? await postClient.update(editId, input) : await postClient.create(input);
      const post = toPostView(response.post, s.user?.id);
      update((s2) => ({
        posts: editId ? s2.posts.map((item) => item.id === editId ? post : item) : [post].concat(s2.posts),
        modals: { ...s2.modals, createPost: false }, editingPostId: null,
      }));
      showToast(editId ? "บันทึกการแก้ไขแล้ว" : "โพสต์เรียบร้อยแล้ว!");
      router.push(isBlog ? "/petory/explore" : "/petory/home");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ postPending: false });
    }
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
  const onPetWeight = (e) => update((s2) => ({ petForm: { ...s2.petForm, weight: e.target.value } }));
  const uploadPetPhoto = pickImage("pet", 1);
  const onPetBio = (e) => update((s2) => ({ petForm: { ...s2.petForm, bio: e.target.value } }));
  const onPetInterests = (e) => update((s2) => ({ petForm: { ...s2.petForm, interestsRaw: e.target.value } }));
  const togglePetPersonality = (label) => update((s2) => {
    const has = s2.petForm.personality.includes(label);
    const personality = has ? s2.petForm.personality.filter((p) => p !== label) : s2.petForm.personality.concat([label]);
    return { petForm: { ...s2.petForm, personality } };
  });
  const goAddPet = () => {
    update({ petForm: { id: null, name: "", species: "Dog", breed: "", age: "", weight: "", photoMediaId: null, gender: "Male", size: "Medium", personality: [], bio: "", interestsRaw: "" } });
    router.push("/petory/pets/new");
  };
  const editPet = (id) => {
    const pet = s.pets.find((p) => p.id === id);
    if (!pet) return;
    update({ petForm: { id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, age: String(pet.age), weight: pet.weightKg == null ? "" : String(pet.weightKg), photoMediaId: pet.photoMediaId ?? null, gender: pet.gender, size: pet.size, personality: pet.personality.slice(), bio: pet.bio, interestsRaw: pet.interests.join(", ") } });
    router.push(`/petory/pets/${id}/edit`);
  };
  const cancelPetForm = () => router.push(s.petForm.id ? `/petory/pets/${s.petForm.id}` : "/petory/pets");
  const savePet = async () => {
    const f = s.petForm;
    if (!f.name.trim()) { showToast("กรุณากรอกชื่อสัตว์เลี้ยง"); return; }
    const age = Number(f.age);
    if (!Number.isInteger(age) || age < 0 || age > 40) { showToast("กรุณากรอกอายุระหว่าง 0 ถึง 40 ปี"); return; }
    const weightKg = f.weight.trim() ? Number(f.weight) : null;
    if (weightKg !== null && !(weightKg > 0 && weightKg <= 500)) { showToast("กรุณากรอกน้ำหนักระหว่าง 0 ถึง 500 กก."); return; }
    const interests = f.interestsRaw.split(",").map((x) => x.trim()).filter(Boolean);
    const input = { name: f.name.trim(), species: f.species, breed: f.breed.trim(), age, weightKg, photoMediaId: f.photoMediaId, gender: f.gender, size: f.size, personality: f.personality, bio: f.bio.trim(), interests };
    update({ petPending: true });
    try {
      const response = f.id ? await petClient.update(f.id, input) : await petClient.create(input);
      const pet = toPetView(response.pet, s.pets.filter((item) => item.ownerId === "me").length);
      update((s2) => ({ pets: f.id ? s2.pets.map((item) => item.id === f.id ? pet : item) : s2.pets.concat([pet]) }));
      showToast(f.id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสัตว์เลี้ยงเรียบร้อยแล้ว!");
      router.push(f.id ? `/petory/pets/${f.id}` : "/petory/pets");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ petPending: false });
    }
  };
  const openDeletePet = (id) => update((s2) => ({ modals: { ...s2.modals, deletePet: true }, deletePetId: id || s2.petForm.id }));
  const closeDeletePet = () => update((s2) => ({ modals: { ...s2.modals, deletePet: false } }));
  const confirmDeletePet = async () => {
    const id = s.deletePetId;
    if (!id) return;
    update({ petPending: true });
    try {
      await petClient.remove(id);
      update((s2) => ({ pets: s2.pets.filter((p) => p.id !== id), modals: { ...s2.modals, deletePet: false } }));
      showToast("ลบสัตว์เลี้ยงแล้ว");
      router.push("/petory/pets");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ petPending: false });
    }
  };

  // ---- matching ----
  const openMatchFilter = () => update((s2) => ({ modals: { ...s2.modals, matchFilter: true } }));
  const closeMatchFilter = () => update((s2) => ({ modals: { ...s2.modals, matchFilter: false } }));
  const togglePetDropdown = () => update((s2) => ({ petDropdownOpen: !s2.petDropdownOpen }));
  const selectMatchingPet = (id) => update({ matchingPetId: id, petDropdownOpen: false });
  /** The choice is stored on the account: candidates only come from accounts
   *  looking for the same thing, so it has to outlive this page. */
  const setMatchingPurpose = async (v2) => {
    const previous = s.matchingPurpose;
    if (v2 === previous) return;
    update((s2) => ({ matchingPurpose: v2, user: s2.user ? { ...s2.user, matchingPurpose: v2 } : s2.user }));
    try {
      await matchingClient.setPurpose(v2);
    } catch (error) {
      update((s2) => ({ matchingPurpose: previous, user: s2.user ? { ...s2.user, matchingPurpose: previous } : s2.user }));
      showToast(error.message);
    }
  };
  const resetMatchFilter = () => update({ matchFilters: { species: "all", distance: "anywhere", gender: "any", size: "all", personality: [] } });
  const setMatchFilter = (key, value) => update((s2) => ({ matchFilters: { ...s2.matchFilters, [key]: value } }));
  const toggleMatchPersonalityFilter = (label) => update((s2) => {
    const has = s2.matchFilters.personality.includes(label);
    const personality = has ? s2.matchFilters.personality.filter((p) => p !== label) : s2.matchFilters.personality.concat([label]);
    return { matchFilters: { ...s2.matchFilters, personality } };
  });
  const passPet = async (id) => {
    const actorPetId = s.matchingPetId || s.pets.find((pet) => pet.ownerId === "me")?.id;
    if (!actorPetId) { showToast("กรุณาเพิ่มสัตว์เลี้ยงก่อนเริ่ม matching"); return false; }
    try {
      await matchingClient.interact(actorPetId, id, "pass");
      update((s2) => ({ passedPetIds: s2.passedPetIds.concat([id]), lastPassedId: id }));
      return true;
    } catch (error) { showToast(error.message); return false; }
  };
  const interestPet = async (id, petName) => {
    const actorPetId = s.matchingPetId || s.pets.find((pet) => pet.ownerId === "me")?.id;
    if (!actorPetId) { showToast("กรุณาเพิ่มสัตว์เลี้ยงก่อนเริ่ม matching"); return false; }
    try {
      const { interaction } = await matchingClient.interact(actorPetId, id, "interest");
      if (interaction.matchId) {
        update((s2) => ({ interestedPetIds: s2.interestedPetIds.concat([id]), matches: s2.matches.concat([{ id: interaction.matchId, petId: id, matchedAt: "วันนี้", updatedAt: Date.now(), messages: [] }]), newMatchPetId: id, newMatchPetName: petName ?? null, modals: { ...s2.modals, mutualMatch: true } }));
      } else {
        update((s2) => ({ interestedPetIds: s2.interestedPetIds.concat([id]) }));
        showToast("ส่งความสนใจแล้ว รอการตอบรับ");
      }
      return true;
    } catch (error) { showToast(error.message); return false; }
  };
  const closeMutualMatch = () => update((s2) => ({ modals: { ...s2.modals, mutualMatch: false }, newMatchPetId: null, newMatchPetName: null }));
  const startChatFromModal = () => {
    const petId = s.newMatchPetId;
    const match = s.matches.slice().reverse().find((m) => m.petId === petId);
    update((s2) => ({ modals: { ...s2.modals, mutualMatch: false }, newMatchPetId: null, newMatchPetName: null }));
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
  const submitReport = async () => {
    if (!s.reportReason || !s.reportTargetId) {
      showToast("กรุณาเลือกรายการรายงาน");
      return;
    }
    if (s.reportTargetType === "user") { try { await socialClient.report(s.reportTargetId, s.reportReason); update((s2) => ({ modals: { ...s2.modals, reportUser: false }, reportReason: "" })); showToast("ขอบคุณสำหรับรายงาน เราจะตรวจสอบโดยเร็ว"); } catch (error) { showToast(error.message); } return; }
    if (s.reportTargetType !== "post") return;
    try {
      await postClient.report(s.reportTargetId, s.reportReason);
      update((s2) => ({ modals: { ...s2.modals, reportPost: false }, reportReason: "" }));
      showToast("ขอบคุณสำหรับรายงาน เราจะตรวจสอบโดยเร็ว");
    } catch (error) {
      showToast(error.message);
    }
  };
  const unblockUser = async (userId) => { try { await socialClient.setBlock(userId, false); update((s2) => ({ blockedUserIds: s2.blockedUserIds.filter((id) => id !== userId) })); showToast("ปลดบล็อกผู้ใช้แล้ว"); } catch (error) { showToast(error.message); } };
  const openBlock = (userId) => update((s2) => ({ modals: { ...s2.modals, block: true }, blockTargetUserId: userId, postMenuOpenId: null }));
  const closeBlock = () => update((s2) => ({ modals: { ...s2.modals, block: false } }));
  const confirmBlock = async () => {
    const uid = s.blockTargetUserId;
    try { await socialClient.setBlock(uid, true); update((s2) => ({ blockedUserIds: s2.blockedUserIds.concat([uid]), followingIds: s2.followingIds.filter((id) => id !== uid), modals: { ...s2.modals, block: false } })); showToast("บล็อกผู้ใช้แล้ว"); } catch (error) { showToast(error.message); }
  };

  // ---- my profile ----
  const goEditProfile = () => {
    const me = s.users.find((u) => u.id === "me");
    if (!me) return;
    update((s2) => ({ profileForm: { name: me.name, location: me.location, bio: me.bio, phone: me.phone, email: me.email }, modals: { ...s2.modals, editProfile: true } }));
  };
  const closeEditProfile = () => update((s2) => ({ modals: { ...s2.modals, editProfile: false } }));
  const onProfileName = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, name: e.target.value } }));
  const onProfileLocation = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, location: e.target.value } }));
  const onProfilePhone = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, phone: e.target.value } }));
  const onProfileEmail = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, email: e.target.value } }));
  const onProfileBio = (e) => update((s2) => ({ profileForm: { ...s2.profileForm, bio: e.target.value } }));
  const saveProfile = async () => {
    const f = s.profileForm;
    update({ profilePending: true });
    try {
      const { account } = await authClient.updateProfile({
        displayName: f.name,
        locationLabel: f.location,
        bio: f.bio,
        phone: f.phone,
      });
      update((s2) => ({
        user: account,
        users: s2.users.map((u) => u.id === "me" ? {
          ...u, name: account.display_name, location: account.location_label || "", bio: account.bio || "", phone: account.phone || "", email: account.email,
        } : u),
        modals: { ...s2.modals, editProfile: false },
      }));
      showToast("บันทึกโปรไฟล์แล้ว");
    } catch (error) {
      showToast(error.message);
    } finally {
      update({ profilePending: false });
    }
  };

  const value = {
    state, update, showToast,
    goHome, goExplore, goMatching, goMessages, goMyPets, goProfile, goFollowing, goFollowers, goSettings, goNotifications,
    onLoginEmail, onLoginPassword, onToggleRemember, loadRememberedEmail, onRegName, onRegEmail, onRegPassword, onRegConfirm,
    goForgot, login, loginBtnClick, register, sendResetLink,
    openLogoutConfirm, closeLogoutConfirm, confirmLogout,
    toggleSpeciesDropdown, selectFeedSpecies, onFeedSearch, toggleSearchOpen, onSearchBlur, setFeedCategory, loadHomeFeed,
    toggleLike, toggleComments, onCommentDraft, submitComment, toggleSave, openPostDetail,
    openUserProfile, toggleFollow, unfollowUser,
    openCreatePost, openCreatePostBlog, openEditPost, togglePostMenu, openDeletePost, closeDeletePost, confirmDeletePost,
    onCreatePostBtnClick, closeCreatePost, onPostCaption, onPostTitle, selectPostCategory, togglePostCategoryDropdown, uploadPostPhoto, pickImage, cancelImageAdjust, confirmImageAdjust, selectPostPet, togglePostPetDropdown, submitPost,
    openPetProfile, onPetName, toggleSpeciesFieldDropdown, toggleGenderFieldDropdown, toggleSizeFieldDropdown,
    selectPetSpecies, selectPetGender, selectPetSize, onPetBreed, onPetAge, onPetWeight, uploadPetPhoto, onPetBio, onPetInterests, togglePetPersonality,
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

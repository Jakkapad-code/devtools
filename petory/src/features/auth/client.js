async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(payload.error ?? "Something went wrong. Please try again.");
  return payload;
}

function postJson(path, body) {
  return requestJson(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getJson(path) {
  try {
    return await requestJson(path);
  } catch (error) {
    if (error.message === "Unauthorized") return null;
    throw error;
  }
}

export const authClient = {
  login: (email, password) => postJson("/api/auth/login", { email, password }),
  register: (displayName, email, password) => postJson("/api/auth/register", { displayName, email, password }),
  logout: () => postJson("/api/auth/logout", {}),
  me: () => getJson("/api/me"),
  updateProfile: (profile) => requestJson("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  }),
};

export const mediaClient = {
  uploadAvatar: (file) => {
    const body = new FormData();
    body.set("file", file);
    return requestJson("/api/media/avatar", { method: "POST", body });
  },
  upload: (file) => {
    const body = new FormData();
    body.set("file", file);
    return requestJson("/api/media", { method: "POST", body });
  },
};

export const petClient = {
  list: () => requestJson("/api/pets"),
  get: (id) => requestJson(`/api/pets/${id}`),
  create: (pet) => postJson("/api/pets", pet),
  update: (id, pet) => requestJson(`/api/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pet),
  }),
  remove: (id) => requestJson(`/api/pets/${id}`, { method: "DELETE" }),
};

export const postClient = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return requestJson(`/api/posts${params.size ? `?${params}` : ""}`);
  },
  get: (id) => requestJson(`/api/posts/${id}`),
  create: (post) => postJson("/api/posts", post),
  update: (id, post) => requestJson(`/api/posts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) }),
  remove: (id) => requestJson(`/api/posts/${id}`, { method: "DELETE" }),
  setLike: (id, active) => requestJson(`/api/posts/${id}/like`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }),
  setSave: (id, active) => requestJson(`/api/posts/${id}/save`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }),
  addComment: (id, body) => postJson(`/api/posts/${id}/comments`, { body }),
  report: (id, reason) => postJson(`/api/posts/${id}/report`, { reason }),
};

export const matchingClient = {
  candidates: (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
      else if (value) params.set(key, value);
    });
    return requestJson(`/api/matching/candidates?${params}`);
  },
  interact: (actorPetId, targetPetId, action) => postJson("/api/matching/interactions", { actorPetId, targetPetId, action }),
  setPurpose: (purpose) => postJson("/api/matching/purpose", { purpose }),
};

export const conversationClient = {
  list: () => requestJson("/api/conversations"),
  messages: (id) => requestJson(`/api/conversations/${id}/messages`),
  send: (id, body) => postJson(`/api/conversations/${id}/messages`, { body }),
};

export const notificationClient = {
  list: () => requestJson("/api/notifications"),
  markAllRead: () => postJson("/api/notifications/read", {}),
};

export const socialClient = {
  blocked: () => requestJson("/api/blocked"),
  following: () => requestJson("/api/following"),
  followers: () => requestJson("/api/followers"),
  suggested: () => requestJson("/api/users/suggested"),
  setFollow: (id, active) => requestJson(`/api/users/${id}/follow`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }),
  setBlock: (id, active) => requestJson(`/api/users/${id}/block`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }),
  user: (id) => requestJson(`/api/users/${id}`),
  report: (id, reason) => postJson(`/api/users/${id}/report`, { reason }),
};

export const adminClient = {
  overview: () => requestJson("/api/admin/overview"),
  reports: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return requestJson(`/api/admin/reports${params.size ? `?${params}` : ""}`);
  },
  resolveReport: (id, status, resolution) => requestJson(`/api/admin/reports/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, resolution }),
  }),
  posts: (search) => requestJson(`/api/admin/posts${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  removePost: (id) => requestJson(`/api/admin/posts/${id}`, { method: "DELETE" }),
  users: (search) => requestJson(`/api/admin/users${search ? `?q=${encodeURIComponent(search)}` : ""}`),
  suspend: (id, duration, reason) => requestJson(`/api/admin/users/${id}/suspension`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duration, reason }),
  }),
  unsuspend: (id) => requestJson(`/api/admin/users/${id}/suspension`, { method: "DELETE" }),
};

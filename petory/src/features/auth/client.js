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

export const petClient = {
  list: () => requestJson("/api/pets"),
  create: (pet) => postJson("/api/pets", pet),
  update: (id, pet) => requestJson(`/api/pets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pet),
  }),
  remove: (id) => requestJson(`/api/pets/${id}`, { method: "DELETE" }),
};

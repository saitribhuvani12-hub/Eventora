// src/api.js
// One helper that every page uses to talk to the server.
// It adds the login token to each request and turns failures into simple results.

const TOKEN_KEY = "eventora-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Usage: const res = await api("GET", "/events");
// Returns { ok, status, data }
export async function api(method, url, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let payload;
  if (body instanceof FormData) {
    payload = body; // used for photo and video uploads
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch("https://eventora-6967.onrender.com/api" + url, { method, headers, body: payload });
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Cannot reach the server. Is it running?" },
    };
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    // the reply had no JSON body
  }

  // An expired or invalid token means we must log in again
  if (res.status === 401 && token && url !== "/auth/login") {
    window.dispatchEvent(new Event("eventora-unauthorized"));
  }

  return { ok: res.ok, status: res.status, data };
}

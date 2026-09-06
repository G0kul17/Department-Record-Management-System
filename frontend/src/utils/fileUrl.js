/**
 * fileUrl.js
 *
 * Short-lived, file-scoped JWT tokens for authenticated file downloads.
 * Issues file-scoped tokens via POST /api/files/:filename/token using the main session JWT.
 */

import { useState, useEffect } from "react";

const tokenCache = new Map(); // filename -> { token, expiresAtMs }

function getApiBaseUrl() {
  return (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:5000/api"
  );
}

/**
 * Obtain a file-scoped token for a specific filename.
 * @param {string} filename
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string|null>} File-scoped JWT or null
 */
export async function getFileToken(filename, forceRefresh = false) {
  if (!filename) return null;
  const cleanFilename = String(filename).trim();
  if (!cleanFilename) return null;

  const now = Date.now();
  const cached = tokenCache.get(cleanFilename);
  // Re-use cached token if it has more than 30 seconds of TTL remaining
  if (!forceRefresh && cached && cached.expiresAtMs - now > 30000) {
    return cached.token;
  }

  const base = getApiBaseUrl();
  const sessionToken = localStorage.getItem("token") || "";
  if (!sessionToken) return null;

  try {
    const res = await fetch(`${base}/files/${encodeURIComponent(cleanFilename)}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    if (!res.ok) {
      console.warn(`Failed to issue file token for ${cleanFilename}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data?.token) {
      const expiresAtMs = data.expiresAt ? new Date(data.expiresAt).getTime() : now + 5 * 60 * 1000;
      tokenCache.set(cleanFilename, { token: data.token, expiresAtMs });
      return data.token;
    }
  } catch (err) {
    console.error(`Error fetching file token for ${cleanFilename}`, err);
  }
  return null;
}

/**
 * Returns an authenticated URL for a stored file.
 * If token parameter is provided or cached, appends ?token=<file_token>.
 * Otherwise triggers background token issuance.
 */
export function getFileUrl(filename, token) {
  if (!filename) return "";
  const cleanFilename = String(filename).trim();
  const base = getApiBaseUrl();
  const url = `${base}/files/${cleanFilename}`;

  if (token) return `${url}?token=${encodeURIComponent(token)}`;

  const cached = tokenCache.get(cleanFilename);
  if (cached && cached.expiresAtMs - Date.now() > 5000) {
    return `${url}?token=${encodeURIComponent(cached.token)}`;
  }

  // Trigger background fetch if logged in
  if (typeof window !== "undefined" && localStorage.getItem("token")) {
    getFileToken(cleanFilename).catch(() => {});
  }

  return url;
}

/**
 * Asynchronously fetch an authenticated URL containing a valid file-scoped token.
 */
export async function getAuthenticatedFileUrl(filename, forceRefresh = false) {
  if (!filename) return "";
  const token = await getFileToken(filename, forceRefresh);
  return getFileUrl(filename, token);
}

/**
 * React hook to reactively load an authenticated file URL.
 */
export function useFileUrl(filename) {
  const [url, setUrl] = useState(() => getFileUrl(filename));

  useEffect(() => {
    let mounted = true;
    if (!filename) return;

    getAuthenticatedFileUrl(filename).then((authUrl) => {
      if (mounted && authUrl) {
        setUrl(authUrl);
      }
    });

    return () => {
      mounted = false;
    };
  }, [filename]);

  return url;
}

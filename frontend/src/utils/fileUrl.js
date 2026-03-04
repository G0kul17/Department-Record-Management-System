/**
 * Returns an authenticated URL for a stored file.
 * Uses /api/files/:filename?token=<jwt> so that browser-native
 * requests (img src, a href) are also authenticated.
 */
export function getFileUrl(filename) {
  if (!filename) return "";
  const base =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_BASE_URL) ||
    "http://localhost:5000/api";
  const token = localStorage.getItem("token") || "";
  const url = `${base}/files/${filename}`;
  return token ? `${url}?token=${token}` : url;
}

import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";

function makeFileUrl(file) {
  if (!file) return null;
  if (file.url && typeof file.url === "string") return file.url;
  if (file.filename) {
    // Use backend base URL (strip any trailing /api) so preview works from the frontend origin
    const base =
      apiClient && apiClient.baseURL
        ? String(apiClient.baseURL).replace(/\/api\/?$/, "")
        : window.location.origin;
    return `${base}/uploads/${file.filename}`;
  }
  return null;
}

export default function AttachmentPreview({ file, onClose }) {
  if (!file) return null;
  const [blobUrl, setBlobUrl] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const url = makeFileUrl(file);
  const name = file.original_name || file.name || file.filename || "attachment";
  const ext = (name.split(".").pop() || "").toLowerCase();

  useEffect(() => {
    let mounted = true;
    let ac = new AbortController();
    async function fetchAsBlob() {
      if (!url) return;
      // Only attempt blob fetch for types that may be previewed
      const previewableExts = [
        "pdf",
        "pptx",
        "ppt",
        "docx",
        "doc",
        "xlsx",
        "xls",
        "txt",
        "log",
        "csv",
        "json",
        "xml",
        "md",
        "odt",
        "ods",
      ];
      if (previewableExts.indexOf(ext) === -1) return;
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const blob = await res.blob();
        const bUrl = URL.createObjectURL(blob);
        if (mounted) {
          setBlobUrl(bUrl);
        } else {
          URL.revokeObjectURL(bUrl);
        }
      } catch (err) {
        if (mounted) setFetchError(err.message || String(err));
        // swallow — fallback to original url
      }
    }
    fetchAsBlob();
    return () => {
      mounted = false;
      ac.abort();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ext]);

  const previewUrl = blobUrl || url;

  const renderContent = () => {
    if (!previewUrl)
      return (
        <div className="p-6 text-center">
          <p className="text-slate-600">
            Preview not available. Please download the file.
          </p>
        </div>
      );

    // Image files
    if (
      ext === "jpg" ||
      ext === "jpeg" ||
      ext === "png" ||
      ext === "gif" ||
      ext === "webp" ||
      ext === "bmp"
    ) {
      return (
        <img
          src={previewUrl}
          alt={name}
          className="max-h-[70vh] mx-auto object-contain"
        />
      );
    }

    // PDF files: try iframe first (more reliable across browsers); show fallbacks
    if (ext === "pdf") {
      const googleViewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
        url
      )}`;
      return (
        <div className="w-full h-[70vh] space-y-3">
          <iframe
            src={previewUrl}
            title={name}
            className="w-full h-full border-0"
          />
          <div className="flex items-center gap-3 text-sm">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Open or download {name}
            </a>
            <span className="text-slate-400">•</span>
            <a
              href={googleViewer}
              target="_blank"
              rel="noreferrer"
              className="text-slate-700 underline"
            >
              Open with Google Viewer
            </a>
            {fetchError && (
              <span className="text-red-600">Preview error: {fetchError}</span>
            )}
          </div>
        </div>
      );
    }

    // Text files (txt, log, etc)
    if (
      ext === "txt" ||
      ext === "log" ||
      ext === "csv" ||
      ext === "json" ||
      ext === "xml" ||
      ext === "md"
    ) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={previewUrl}
            title={name}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
          />
        </div>
      );
    }

    // Office files (pptx, docx, xlsx, etc)
    if (
      ext === "pptx" ||
      ext === "ppt" ||
      ext === "docx" ||
      ext === "doc" ||
      ext === "xlsx" ||
      ext === "xls" ||
      ext === "odt" ||
      ext === "ods"
    ) {
      // Office files - provide download and Google viewer links
      const publicViewer = `https://docs.google.com/gview?url=${encodeURIComponent(
        url
      )}&embedded=true`;
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <svg
            className="w-16 h-16 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-600 text-center">Office document preview</p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href={previewUrl}
              download={name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </a>
            <a
              href={publicViewer}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open with Google Viewer
            </a>
          </div>
          {fetchError && (
            <div className="text-sm text-red-600 mt-4">
              Preview error: {fetchError}
            </div>
          )}
        </div>
      );
    }

    // Video files
    if (
      ext === "mp4" ||
      ext === "webm" ||
      ext === "avi" ||
      ext === "mov" ||
      ext === "mkv"
    ) {
      return (
        <div className="w-full h-[70vh]">
          <video className="w-full h-full" controls>
            <source src={previewUrl} type={`video/${ext}`} />
            <p>
              Video preview not supported.{" "}
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Download {name}
              </a>
            </p>
          </video>
        </div>
      );
    }

    // Audio files
    if (
      ext === "mp3" ||
      ext === "wav" ||
      ext === "m4a" ||
      ext === "aac" ||
      ext === "flac"
    ) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <svg
            className="w-16 h-16 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          <audio className="w-full max-w-md" controls>
            <source src={previewUrl} type={`audio/${ext}`} />
            <p>Audio preview not supported.</p>
          </audio>
          <a
            href={previewUrl}
            download={name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download
          </a>
        </div>
      );
    }

    // Archive files
    if (
      ext === "zip" ||
      ext === "rar" ||
      ext === "7z" ||
      ext === "tar" ||
      ext === "gz"
    ) {
      return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <svg
            className="w-16 h-16 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-600">Archive file</p>
          <a
            href={previewUrl}
            download={name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download {ext.toUpperCase()}
          </a>
        </div>
      );
    }

    // Fallback: show download link for unknown types
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <svg
          className="w-16 h-16 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-slate-600">File preview not available</p>
        <a
          href={previewUrl}
          download={name}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Download {name}
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 max-w-4xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold">{name}</div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-auto">
          {/* Log constructed URL for easier debugging */}
          {console.log(
            "AttachmentPreview: url=",
            url,
            " previewUrl=",
            previewUrl
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

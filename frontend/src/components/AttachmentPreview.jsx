import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosClient";

function makeFileUrl(file) {
  if (!file) return null;
  if (file.url && typeof file.url === "string") return file.url;
  if (file.filename) {
    // Use backend base URL (strip any trailing /api) so preview works from the frontend origin
    const base = (apiClient && apiClient.baseURL) ? String(apiClient.baseURL).replace(/\/api\/?$/, "") : window.location.origin;
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
      // Only attempt blob fetch for types that may be previewed (pdf, images, office files)
      if (['pdf', 'pptx', 'ppt', 'docx', 'xlsx'].indexOf(ext) === -1) return;
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
    if (!previewUrl) return (
      <div className="p-4">No preview available</div>
    );
    if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif") {
      return <img src={previewUrl} alt={name} className="max-h-[70vh] mx-auto" />;
    }
    if (ext === "pdf") {
      // Prefer blob/object embedding which is more reliable for PDFs
      return (
        <div className="w-full h-[70vh]">
          <object data={previewUrl} type="application/pdf" className="w-full h-full">
            <p>
              PDF preview is not available. 
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open or download {name}</a>
            </p>
          </object>
        </div>
      );
    }
    if (ext === "pptx" || ext === "ppt" || ext === "docx" || ext === "xlsx") {
      // Google viewer requires a public URL; if we created a blob URL it's not public.
      // For Office formats, offer a download/open link and a helpful message.
      const publicViewer = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <div className="p-4">
          <p className="mb-2">Inline preview for this document type may not be available in this environment.</p>
          <div className="flex gap-3">
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open / Download {name}</a>
            {/* If original url is public, allow opening via Google viewer */}
            {url && url !== previewUrl && (
              <a href={publicViewer} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open with Google Viewer</a>
            )}
          </div>
          {fetchError && <div className="text-sm text-red-600 mt-2">Preview error: {fetchError}</div>}
        </div>
      );
    }
    // Fallback: show download link
    return (
      <div className="p-4">
        <p className="mb-2">No inline preview available.</p>
        <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Download {name}</a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 max-w-4xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold">{name}</div>
          <button onClick={onClose} className="px-3 py-1 text-sm text-slate-700">Close</button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-auto">
          {/* Log constructed URL for easier debugging */}
          {console.log("AttachmentPreview: url=", url, " previewUrl=", previewUrl)}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

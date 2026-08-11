import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../hooks/useAuth";

export default function AvatarPicker({ open, onClose }) {
  const { updateUser } = useAuth();
  const [tab, setTab] = useState("upload");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [saving, setSaving] = useState(false);

  // Camera refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open && tab === "camera") {
      startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setBlob(file);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 512 }, height: { ideal: 512 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please allow permission.");
      setTab("upload");
    }
  }

  function stopCamera() {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight) || 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    // Draw center square crop
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(
      (b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        setPreviewUrl(url);
        setBlob(b);
        stopCamera();
        setTab("upload");
      },
      "image/jpeg",
      0.9
    );
  }

  async function save() {
    if (!blob) {
      alert("Please select or capture a photo");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      const fileName = "avatar.jpg";
      const finalBlob = blob instanceof Blob ? blob : new Blob([blob]);
      fd.append("avatar", finalBlob, fileName);
      const res = await apiClient.uploadFile("/auth/profile/photo", fd);
      const url = res.photoUrl;
      // Update local user context so Navbar shows immediately
      updateUser({
        photoUrl: url,
        avatarUrl: url,
        imageUrl: url,
        profilePic: url,
      });
      onClose?.();
    } catch (err) {
      alert(err.message || "Failed to upload photo");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[10001] w-[92vw] max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-semibold">Change Profile Photo</div>
          <button
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3 flex gap-2">
            <button
              className={`px-3 py-1 rounded-md text-sm ${
                tab === "upload" ? "bg-slate-800 text-white" : "bg-slate-100"
              }`}
              onClick={() => setTab("upload")}
            >
              Upload
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm ${
                tab === "camera" ? "bg-slate-800 text-white" : "bg-slate-100"
              }`}
              onClick={() => setTab("camera")}
            >
              Camera
            </button>
          </div>

          {tab === "upload" ? (
            <div className="space-y-3">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-40 w-40 rounded-xl object-cover border"
                />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <video
                ref={videoRef}
                className="h-48 w-full rounded-xl bg-black"
              />
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-[#87CEEB] text-white hover:bg-[#78C5E6]"
                  onClick={capturePhoto}
                >
                  Capture
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t p-4">
          <button
            className="px-3 py-2 rounded-md bg-slate-100"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[#87CEEB] text-white hover:bg-[#78C5E6] disabled:opacity-50"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

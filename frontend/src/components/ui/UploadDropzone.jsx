import React, { useRef, useState } from "react";

export default function UploadDropzone({
  label = "Upload and attach files",
  subtitle = "Attachments will be a part of this project.",
  accept = ".csv,.xlsx",
  maxSizeMB = 25,
  onFileSelected,
  onFilesSelected,
  selectedFile,
  selectedFiles,
  multiple = false,
  required = false,
}) {
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");

  const openPicker = () => inputRef.current && inputRef.current.click();

  const handleFiles = (filesList) => {
    if (!filesList || !filesList.length) return;
    const files = multiple ? Array.from(filesList) : [filesList[0]];
    setError("");
    const maxBytes = maxSizeMB * 1024 * 1024;

    // If accept is "*" or "*/*" (or contains a wildcard), allow all file types
    const allowAllTypes =
      accept === "*" || accept === "*/*" || /\*/.test(accept || "");
    const exts = allowAllTypes
      ? []
      : accept
          .split(",")
          .map((s) => s.trim().replace(".", "").toLowerCase())
          .filter(Boolean);

    for (const f of files) {
      if (f.size > maxBytes) {
        setError(`File too large. Max ${maxSizeMB} MB`);
        return;
      }

      // Skip file type check if allow all types
      if (!allowAllTypes) {
        const name = (f.name || "").toLowerCase();
        const ok = exts.length
          ? exts.some((e) => name.endsWith(`.${e}`))
          : true;
        if (!ok) {
          setError(`Unsupported file type. Allowed: ${accept}`);
          return;
        }
      }
    }
    if (multiple) {
      onFilesSelected && onFilesSelected(files);
    } else {
      onFileSelected && onFileSelected(files[0]);
    }
  };

  return (
    <div>
      {label && (
        <div className="mb-2">
          <h3 className="text-base font-semibold text-slate-800">
            {label}
            {required && <span className="ml-1 text-red-600">*</span>}
          </h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={openPicker}
        role="button"
        aria-label="File upload dropzone"
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-4 sm:p-6 transition ${
          isDragOver
            ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40"
            : "border-slate-200 dark:border-slate-800 hover:border-blue-500/60 bg-white dark:bg-slate-900"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          aria-required={required ? "true" : "false"}
          required={required}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V4m0 0l-4 4m4-4l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold underline">
              Click to Upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-slate-500">
            (Max. File size: {maxSizeMB} MB)
          </p>
          {selectedFile && !multiple && (
            <p className="mt-2 text-xs text-slate-600">
              Selected: {selectedFile.name}
            </p>
          )}
          {multiple &&
            Array.isArray(selectedFiles) &&
            selectedFiles.length > 0 && (
              <div className="mt-2 text-xs text-slate-600">
                <div>Selected ({selectedFiles.length}):</div>
                <ul className="mt-1 max-h-20 overflow-auto space-y-0.5">
                  {selectedFiles.slice(0, 5).map((f, i) => (
                    <li key={i} className="truncate">
                      {f.name}
                    </li>
                  ))}
                  {selectedFiles.length > 5 && (
                    <li className="text-slate-500">
                      +{selectedFiles.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

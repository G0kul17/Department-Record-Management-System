import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileText,
  Download,
  Copy,
  CheckCircle,
  FileIcon,
  AlertCircle,
} from "lucide-react";


export default function PublicProofViewer() {
  const { filename } = useParams();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  // Construct the public API URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
  const publicApiUrl = `${API_BASE_URL}/public/files/${filename}`;
  const downloadUrl = `${publicApiUrl}?download=true`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  const isPdf = /\.pdf$/i.test(filename);
  const isPreviewable = isImage || isPdf;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {filename}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Public Document
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          <a
            href={downloadUrl}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 flex justify-center bg-gray-100">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
          {isPreviewable ? (
            isImage ? (
              <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 overflow-auto">
                <img
                  src={publicApiUrl}
                  alt={filename}
                  className="max-w-full max-h-full object-contain rounded shadow-sm"
                  onError={() => setError(true)}
                />
                {error && (
                  <div className="text-center text-gray-500 flex flex-col items-center">
                    <AlertCircle className="w-12 h-12 mb-2 text-red-400" />
                    <p>Failed to load image preview.</p>
                  </div>
                )}
              </div>
            ) : (
              <iframe
                src={publicApiUrl}
                className="w-full h-full border-0"
                title={filename}
                onError={() => setError(true)}
              />
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
              <FileIcon className="w-24 h-24 text-gray-400 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Preview Not Available
              </h2>
              <p className="text-gray-500 mb-8 max-w-md">
                This file type cannot be previewed in the browser. Please download the file to view its contents.
              </p>
              <a
                href={downloadUrl}
                className="inline-flex items-center space-x-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download Proof Document</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

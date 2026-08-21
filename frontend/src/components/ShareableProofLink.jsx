import React, { useState } from "react";
import { Link2, CheckCircle } from "lucide-react";

export default function ShareableProofLink({ type, id, filename, className = "" }) {
  const [copied, setCopied] = useState(false);

  // Still need filename just to know if there's a proof attached, though for some 
  // records like achievements without proof we might still want to share the card. 
  // Let's rely on type and id for the URL.
  if (!type || !id) return null;

  const handleCopy = () => {
    // Construct the new public URL
    const publicUrl = `${window.location.origin}/share/${type}/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        copied
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
      } ${className}`}
      title="Copy public shareable link"
    >
      {copied ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 text-gray-500" />
          <span>Share Link</span>
        </>
      )}
    </button>
  );
}

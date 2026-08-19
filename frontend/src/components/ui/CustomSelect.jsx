import React, { useEffect, useRef, useState } from "react";

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  itemClassName = "",
  required = false,
  name,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const normalizedOptions = (options || []).map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const sortedOptions = [...normalizedOptions].sort((a, b) => {
    const isCustomA = a.value === "__custom__" || String(a.label || a.value).toLowerCase() === "other" || String(a.label || a.value).toLowerCase() === "others";
    const isCustomB = b.value === "__custom__" || String(b.label || b.value).toLowerCase() === "other" || String(b.label || b.value).toLowerCase() === "others";
    if (isCustomA && !isCustomB) return 1;
    if (!isCustomA && isCustomB) return -1;

    const labelA = String(a.label !== undefined ? a.label : a.value);
    const labelB = String(b.label !== undefined ? b.label : b.value);
    return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: "base" });
  });

  const selectedLabel =
    normalizedOptions.find((opt) => opt.value === value)?.label ||
    value ||
    placeholder;

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-black focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        } ${buttonClassName}`}
        aria-expanded={open}
        aria-disabled={disabled}
      >
        {selectedLabel}
      </button>
      {required && (
        <input
          type="text"
          name={name}
          value={value || ""}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          required
        />
      )}
      {open && !disabled && (
        <div
          className={`absolute left-0 right-0 mt-2 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg z-20 ${menuClassName}`}
        >
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm text-black hover:text-black ${
              value === "" ? "bg-sky-200" : "hover:bg-slate-100"
            } ${itemClassName}`}
          >
            {placeholder}
          </button>
          {sortedOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm text-black hover:text-black ${
                value === opt.value ? "bg-sky-200" : "hover:bg-slate-100"
              } ${opt.disabled ? "cursor-not-allowed opacity-60" : ""} ${
                itemClassName
              }`}
              disabled={opt.disabled}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

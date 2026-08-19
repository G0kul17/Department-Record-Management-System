import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../api/axiosClient";

export default function StaffNameInput({ value, onChange, placeholder = "Enter name", required, className }) {
  const [suggestions, setSuggestions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);

  // Load staff names on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/auth/staff-names");
        if (!mounted) return;
        if (Array.isArray(res)) {
          setSuggestions(res.map(u => u.full_name));
        } else if (Array.isArray(res.data)) {
          setSuggestions(res.data.map(u => u.full_name));
        }
      } catch (e) {
        console.error("Failed to load staff names", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter suggestions when value changes
  useEffect(() => {
    if (!value) {
      setFiltered([]);
      return;
    }
    const query = String(value).toLowerCase();
    const matches = suggestions.filter(name => 
      name.toLowerCase().includes(query) && name.toLowerCase() !== query
    );
    setFiltered(matches);
  }, [value, suggestions]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        className={className}
        value={value}
        onChange={onChange}
        onFocus={() => setShow(true)}
        placeholder={placeholder}
        required={required}
      />
      {show && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-50 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  onChange({ target: { value: name } });
                  setShow(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

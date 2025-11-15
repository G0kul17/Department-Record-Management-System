import React, { useState } from "react";

const InputField = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = "",
}) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full ${
            isPassword ? "pr-10" : ""
          } px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
            error
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-slate-700"
          } ${
            disabled
              ? "bg-gray-100 dark:bg-slate-800 cursor-not-allowed"
              : "bg-white dark:bg-slate-900"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            tabIndex={0}
          >
            {show ? (
              // Eye-off icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M3 3l18 18M10.584 10.59A3 3 0 0012 15a3 3 0 002.412-4.824M9.88 5.08A9.98 9.98 0 0112 5c4.418 0 8.167 2.867 9.542 6.836a1.1 1.1 0 010 .328 10.515 10.515 0 01-2.037 3.474M6.17 6.17A10.513 10.513 0 002.458 11.5a1.1 1.1 0 000 .328C3.833 15.797 7.582 18.664 12 18.664c1.067 0 2.09-.167 3.045-.478"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              // Eye icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
              >
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default InputField;

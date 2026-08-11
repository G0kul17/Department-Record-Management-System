import React, { useMemo } from "react";

/**
 * BlurText — a lightweight blur-in text animation inspired by react-bits.
 * Props:
 *  - text: string to render
 *  - className: extra classes for the wrapper (e.g., font sizes, weight)
 *  - delay: base delay in ms before the animation starts
 *  - step: additional delay per character in ms (default 30)
 */
export default function BlurText({
  text = "",
  className = "",
  delay = 0,
  step = 30,
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          className="blur-char"
          style={{ animationDelay: `${delay + i * step}ms` }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

import React from "react";

interface NzemboLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function NzemboLogo({
  className = "",
  showText = true,
  size = "md",
}: NzemboLogoProps) {
  const sizes = {
    sm: { width: 120, height: 36 },
    md: { width: 160, height: 48 },
    lg: { width: 200, height: 60 },
  };

  const { width, height } = sizes[size];

  if (!showText) {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        width={height}
        height={height}
      >
        <defs>
          <linearGradient id="nzIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <g transform="translate(8, 10)">
          <path
            d="M6 44V8h5.5l16 22V8h5.5v36h-5.5L11.5 22v22H6z"
            fill="url(#nzIconGrad)"
          />
          <path
            d="M38 18a11 11 0 0 1 0 18"
            fill="none"
            stroke="url(#nzIconGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M43 12a18 18 0 0 1 0 30"
            fill="none"
            stroke="url(#nzIconGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 200 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={width}
      height={height}
    >
      <defs>
        <linearGradient id="nzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g fill="url(#nzGrad)">
        <path d="M10 48V12h6l18 24V12h6v36h-6L16 24v24h-6z" />
        <path
          d="M48 20a12 12 0 0 1 0 20"
          fill="none"
          stroke="url(#nzGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M54 14a20 20 0 0 1 0 32"
          fill="none"
          stroke="url(#nzGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M60 8a28 28 0 0 1 0 44"
          fill="none"
          stroke="url(#nzGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </g>
      <text
        x="72"
        y="42"
        fontFamily="var(--font-brand), Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize="32"
        fill="white"
      >
        zembo
      </text>
    </svg>
  );
}

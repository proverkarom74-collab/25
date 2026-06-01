import React from "react";
import { getRatingColor } from "../lib/ratingUtils";

interface RatingBadgeProps {
  rating: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  id?: string;
  className?: string;
  forceScale10?: boolean; // Kept for backwards compatibility but ignored
}

export function RatingBadge({
  rating,
  size = "medium",
  showLabel = false,
  id,
  className = "",
  forceScale10 = false // Ignored because we always show 100-point scale now
}: RatingBadgeProps) {
  // Normalize rating to 100 scale: e.g. 8.5 -> 85
  const val100 = rating <= 10 ? rating * 10 : rating;
  const color = getRatingColor(val100);

  // Round to nearest integer if fractional part is 0, or show 1 decimal place (e.g., 85.5)
  const displayValue = (val100 % 1 === 0) ? Math.round(val100).toString() : val100.toFixed(1).replace(/\.0$/, "");

  const sizeClasses = {
    small: "text-[11px] font-bold px-1.5 py-0.5 rounded border leading-none font-mono tracking-tight",
    medium: "text-sm font-extrabold px-2.5 py-1 rounded-lg border leading-tight font-mono tracking-tight",
    large: "text-4xl font-black px-4 py-2 rounded-xl border-2 leading-none font-mono tracking-tighter"
  };

  const borderOpacityColor = `${color}40`; // 25% opacity
  const bgOpacityColor = `${color}12`; // 7% opacity

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
      style={{
        color: color,
        borderColor: borderOpacityColor,
        backgroundColor: bgOpacityColor,
      }}
    >
      <span>{displayValue}</span>
      {showLabel && (
        <span className="text-[0.78em] font-semibold opacity-70 ml-1">
          /100
        </span>
      )}
    </span>
  );
}

export default RatingBadge;

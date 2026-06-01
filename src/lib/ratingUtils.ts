export function getRatingColor(rating: number): string {
  // If the rating is on a 0-100 scale (e.g. 85), normalize to 0-10 by dividing by 10.
  const val = rating > 10 ? rating / 10 : rating;

  if (val >= 9.0) return "#22C55E"; // Bright Green
  if (val >= 8.0) return "#4ADE80"; // Green
  if (val >= 7.0) return "#A3E635"; // Light Green / Lime
  if (val >= 6.0) return "#FACC15"; // Yellow / Orange-yellow
  if (val >= 5.0) return "#FB923C"; // Orange
  if (val >= 4.0) return "#F87171"; // Reddish-orange
  return "#EF4444"; // Red
}

export function getMetacriticColor(val: number | undefined): string {
  if (val === undefined) return "#71717a"; // gray-500
  if (val >= 80) return "#22C55E"; // Green
  if (val >= 60) return "#FACC15"; // Yellow
  return "#EF4444"; // Red
}

export function getRottenTomatoesColor(val: number | undefined): string {
  if (val === undefined) return "#71717a"; // gray-500
  if (val >= 75) return "#22C55E"; // Green
  if (val >= 60) return "#FACC15"; // Yellow
  return "#EF4444"; // Red
}

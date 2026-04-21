// Determine if text on a background color should be dark or light
export function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const PLATFORM_COLORS: Record<string, { bg: string; text: string }> = {
  airbnb: { bg: "#FF5A5F", text: "#fff" },
  booking: { bg: "#003580", text: "#fff" },
  agoda: { bg: "#5C2D91", text: "#fff" },
  other: { bg: "#6b7280", text: "#fff" },
};

/**
 * TSX-readable subtitle specification. HyperFrames renders index.html directly;
 * this companion file documents the same three HSC clips for TSX-based tooling.
 */
export const hscSubtitles = [
  // Hook, 0–2 seconds
  { id: "caption-hook", start: 0, duration: 2, text: "盛夏 重新定義" },
  // Show, 2–6 seconds
  { id: "caption-show", start: 2, duration: 4, text: "手沖 + 西西里檸檬" },
  // Call, 6–8 seconds
  { id: "caption-call", start: 6, duration: 2, text: "本週限定 立即購買" }
] as const;

export const subtitleStyle = {
  width: 1080,
  height: 1920,
  fontFamily: '"Noto Sans TC", "Source Han Sans TC", sans-serif',
  fontWeight: 700,
  fontSize: 56,
  color: "#FFFFFF",
  outline: "2px rgba(0, 0, 0, 0.65)",
  horizontalPadding: 54,
  bottom: 330,
  fadeSeconds: 0.3
} as const;

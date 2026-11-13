export type Tone = "blue" | "purple" | "green" | "amber" | "red" | "slate";
export const TONE: Record<Tone, { icon: string; bg: string }> = {
  blue: { icon: "#2f5fb8", bg: "#dbe8fb" }, purple: { icon: "#6d28d9", bg: "#ece3fd" }, green: { icon: "#238a4d", bg: "#d9f3e3" },
  amber: { icon: "#c98a0c", bg: "#fcefcb" }, red: { icon: "#c53737", bg: "#fcdcdb" }, slate: { icon: "#556277", bg: "#e3e8ef" },
};
// Kelas warna lama ("text-risk-high bg-red-50", dst.) -> tone, supaya pemanggil lama tak perlu berubah
export function toneOf(cls = ""): Tone {
  if (/purple/.test(cls)) return "purple";
  if (/risk-low|green/.test(cls)) return "green";
  if (/risk-mid|amber/.test(cls)) return "amber";
  if (/risk-high|red/.test(cls)) return "red";
  if (/slate/.test(cls)) return "slate";
  return "blue";
}

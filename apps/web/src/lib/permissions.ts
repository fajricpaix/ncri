export type Role = "ADMIN" | "ANALYST" | "REVIEWER" | "VIEWER";
export type User = { id: string; name: string; email: string; role: Role; is_active: boolean };

// Cermin services/api/app/auth.py. Hanya untuk menyembunyikan tombol; yang menegakkan izin adalah API.
const NEEDED = {
  analyze: ["ANALYST"], // hitung risiko, import CSV, generate AI
  triage: ["ANALYST", "REVIEWER"], // tinjau/tutup early warning
  review: ["REVIEWER"], // setujui/tolak draft AI & rekomendasi
  admin: [],
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof NEEDED;

export function can(role: Role, action: Action) {
  return role === "ADMIN" || (NEEDED[action] as readonly Role[]).includes(role);
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin", ANALYST: "Analyst", REVIEWER: "Reviewer", VIEWER: "Viewer",
};

# Autentikasi & Hak Akses

Kode: `services/api/app/auth.py`, `auth_routes.py`; web: `apps/web/src/lib/{api-client,api-server,permissions,user-context}.ts`, `proxy.ts`. Terakhir diperbarui: 2026-11-12.

## Sesi
Login `POST /auth/login` → API menerbitkan JWT (HS256, 8 jam) di cookie **httpOnly** `ncri_session`. JavaScript browser tidak pernah memegang token. Setiap request memuat ulang pengguna dari DB, jadi menonaktifkan akun berlaku seketika. Kata sandi di-hash scrypt (stdlib), minimal 10 karakter. Login dibatasi 10 percobaan/menit/IP, dan waktu respons tidak membedakan email yang ada/tidak.

## Matriks izin (ADMIN selalu boleh semua)
| Aksi | Viewer | Analyst | Reviewer | Admin |
|---|:-:|:-:|:-:|:-:|
| Lihat semua data, risiko, peringatan, rekomendasi | ✓ | ✓ | ✓ | ✓ |
| Import CSV, tambah objek/sumber, hitung risiko, generate draft AI | | ✓ | | ✓ |
| Tinjau/tutup early warning | | ✓ | ✓ | ✓ |
| Setujui/tolak draft AI & rekomendasi | | | ✓ | ✓ |
| Kelola pengguna, lihat audit log | | | | ✓ |

Penegakan ada di API (`require(...)` per endpoint). `permissions.ts` di web hanya menyembunyikan tombol dan harus dijaga selaras.

## Perlindungan
- **CSRF**: semua POST/PATCH/DELETE wajib header `X-NCRI-Client: web` (memaksa preflight CORS; form lintas-situs tidak bisa menunggangi cookie). CORS hanya untuk origin di `CORS_ORIGINS`.
- `proxy.ts` hanya cek optimistis (ada cookie atau tidak). Otorisasi sebenarnya di API; 401 dari API → redirect `/login`.
- Admin tidak bisa menonaktifkan/menurunkan role akunnya sendiri (cegah terkunci).
- Di luar `APP_ENV=development`, API menolak start bila `AUTH_SECRET` kosong/lemah. Akun demo hanya dibuat di development.
- Audit log mencatat pengguna untuk: login (berhasil/gagal), import, pembuatan data, hitung risiko, generate AI, review, perubahan pengguna.

## Deploy lintas situs (mis. web di Vercel, API di host lain)
Set `COOKIE_SECURE=true` dan `COOKIE_SAMESITE=none`, `CORS_ORIGINS=https://<domain-web>`, dan pastikan `NEXT_PUBLIC_API_BASE_URL` memakai HTTPS. Browser pihak-ketiga yang memblokir cookie lintas situs akan merusak login; domain induk yang sama (mis. `app.` dan `api.`) lebih aman.

## Belum ada
Reset kata sandi mandiri, MFA, kunci akun setelah gagal berulang (hanya rate limit per IP), pencabutan token sebelum kedaluwarsa (selain menonaktifkan akun), aturan pembuat ≠ penyetuju.

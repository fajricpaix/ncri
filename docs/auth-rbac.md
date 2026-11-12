# Autentikasi & Hak Akses

Kode: `services/api/app/auth.py`, `auth_routes.py`; web: `apps/web/src/lib/{api-client,api-server,permissions,user-context}.ts`, `proxy.ts`. Terakhir diperbarui: 2026-11-12.

## Sesi
Login `POST /auth/login` → API menerbitkan JWT (HS256, 8 jam) di cookie **httpOnly** `ncri_session`. JavaScript browser tidak pernah memegang token. Setiap request memuat ulang pengguna dari DB, jadi menonaktifkan akun berlaku seketika. Kata sandi di-hash scrypt (stdlib), minimal 10 karakter. Waktu respons login tidak membedakan email yang ada/tidak.

**Pencabutan sesi**: tiap user punya `token_version` yang masuk ke JWT. Logout, ganti sandi, ganti role, dan aktif/nonaktif menaikkannya, sehingga token lama (termasuk yang dicuri lalu diputar ulang) langsung ditolak. Konsekuensi: logout di satu perangkat mengeluarkan akun itu dari semua perangkat.

**Batas login**: (1) per IP, 10 percobaan/menit; (2) per akun, 5 kali gagal dalam 15 menit → 429 selama jendela itu, juga untuk email yang tidak terdaftar (tidak membocorkan apakah akun ada). Hitungan disimpan di tabel `login_failures` (database, TTL berbasis waktu, tanpa eviksi): membanjiri email acak tidak bisa membuka kunci korban, dan berlaku lintas proses. Penyerang bisa mengunci akun korban selama 15 menit tetapi tidak bisa menebak sandi; kunci tidak melintasi akun lain. IP klien diambil dari `X-Forwarded-For` hanya bila `TRUSTED_PROXY_HOPS` > 0 (entri ke-N dari kanan); selain itu header diabaikan agar tidak bisa dipalsukan. **Di belakang proxy/Vercel/Render wajib mengisi `TRUSTED_PROXY_HOPS`**, kalau tidak semua pengguna terlihat berasal dari satu IP proxy.

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
Reset kata sandi mandiri, MFA, aturan pembuat ≠ penyetuju. Rate limit per IP (login dan LLM) masih in-memory per proses (tidak dibagi antar worker; pakai Redis bila API multi-proses). Penguncian per akun sudah di database.

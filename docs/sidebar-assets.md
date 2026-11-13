# Aset ilustrasi sidebar

Tiap menu punya satu landmark (gambar transparan) yang disisipkan di antara batik belakang dan batik depan
(`apps/web/src/components/layout/SidebarArt.tsx`). Keputusan 13 Nov 2026:

| Menu | Landmark | Status |
|---|---|---|
| Beranda (`/`) | Borobudur | ada (v1 vektor) |
| Cultural Risk Assessment | Rumah Tongkonan Toraja | ada (v1 vektor) |
| AI Predictive Risk Engine | Kapal Pinisi Bugis | ada (v1 vektor) |
| Risk Mapping (GIS) | Pura Ulun Danu Bratan, Bali | ada (v1 vektor) |
| Cultural Repository | Rumah Gadang Minangkabau | ada (foto domain publik, Wikimedia Commons) |
| Recommendation Engine | Penenun songket dan alat tenun | ada (v1 vektor) |
| Data Submission | Naskah lontar dan pustaka tradisional | ada (v1 vektor) |
| AI Assistant | Burung Garuda dan sayap | ada (v1 vektor) |
| Reports | Monumen Nasional (Monas) | ada (v1 vektor) |
| Settings | Gapura candi bentar Bali | ada (v1 vektor) |

## Format file
- WebP/PNG **transparan**, lebar 816 px (tinggi bebas, sekitar 600-700), disimpan di `public/brand/sidebar/landmark/<nama-menu>.webp`.
- Dasar objek menempel di tepi bawah file (disembunyikan gelombang batik depan). Sisi kiri/kanan boleh terpotong.
- Gaya (acuan: gambar Borobudur dari mockup): ilustrasi lukisan digital, bukan foto; cahaya emas hangat dari satu sisi,
  bayangan biru senja; palet selaras navy `#0f223d` dan emas `#d9a93a`; satu objek utama dengan siluet jelas; latar polos/dihapus.

## Contoh prompt (generator gambar)
> Digital painting, stylized illustration of {LANDMARK}, warm golden sunset light on one side, deep blue dusk shadows,
> soft haze behind, centered single subject with strong silhouette, clean edges, no text, no people, plain background
> (to be removed), vertical-friendly composition, palette navy blue and gold, Indonesian cultural heritage.

Foto dengan langit terang bisa diubah jadi aset otomatis: `python scripts/make_sidebar_assets.py landmark foto.jpg nama x0 x1 y0 y1 ybase`.

## Status v1
Semua landmark kecuali Cultural Repository dibuat sebagai ilustrasi vektor sederhana oleh `apps/web/scripts/build-sidebar-art.mjs`
(`node scripts/build-sidebar-art.mjs [nama]` dari apps/web, hasil WebP transparan 816x700). Ini placeholder grafis, BELUM setara gaya lukisan
mockup Borobudur. Untuk kualitas akhir: buat dengan generator gambar memakai prompt di atas, hapus latar, simpan dengan nama yang sama
(file akan menimpa). Cultural Repository memakai foto Rumah Gadang (Wikimedia Commons, domain publik Indonesia).

"use client";
import { BarChart3, Eye, Fingerprint, Lock, Mail, EyeOff, MapPinned, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedLogo } from "@/components/layout/AnimatedLogo";
import { apiFetch } from "@/lib/api-client";

const DEMO = process.env.NEXT_PUBLIC_DEMO_LOGINS === "true"; // hanya untuk demo lokal/kompetisi
const DEMO_ROLES = ["admin", "analyst", "reviewer", "viewer"];

// ikon melayang di panel kiri: [ikon, posisi, delay]
const FLOATERS: [LucideIcon, string, string, string][] = [
  [MapPinned, "Pemetaan Risiko", "right-[5%] top-[12%]", "0s"],
  [BarChart3, "Analitik Prediktif", "right-[14%] top-[36%]", "-2s"],
  [ShieldCheck, "Early Warning", "right-[4%] top-[60%]", "-4s"],
];
const CHIPS = ["Pemetaan Risiko", "Early Warning", "AI Insight"];

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [bio, setBio] = useState(false); // perangkat punya biometrik (WebAuthn)
  useEffect(() => {
    window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.().then(setBio).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      if (r.status === 401) setError("Email atau kata sandi salah.");
      else if (r.status === 429) setError("Terlalu banyak percobaan. Coba lagi sebentar.");
      else if (!r.ok) setError("Gagal masuk. Coba lagi.");
      else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel kiri: identitas */}
      <section className="relative hidden overflow-hidden bg-navy text-white lg:block">
        <div className="l-kenburns absolute inset-0 bg-[url('/brand/sidebar/landmark/borobudur.webp')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/70" />
        {/* cahaya emas */}
        <div className="l-glow absolute -left-32 top-[8%] size-[620px] rounded-full bg-[radial-gradient(circle,rgb(217_169_58/.35),transparent_65%)]" aria-hidden />
        {/* partikel berkelip */}
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="l-twinkle absolute size-1 rounded-full bg-gold-soft"
            style={{ left: `${(i * 37 + 11) % 97}%`, top: `${(i * 53 + 7) % 83}%`, animationDelay: `${(i % 6) * -0.9}s` }} aria-hidden />
        ))}
        <svg className="l-spin absolute -right-48 -top-48 size-[640px] text-gold/25" viewBox="0 0 100 100" fill="none" aria-hidden>
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth=".3" strokeDasharray="1 2" />
          <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth=".3" />
        </svg>
        {FLOATERS.map(([Icon, label, pos, delay]) => (
          <div key={label} style={{ animationDelay: delay }} className={`l-float absolute ${pos} hidden items-center gap-3 rounded-2xl bg-white/10 py-3 pl-3 pr-5 ring-1 ring-white/25 backdrop-blur-md xl:flex`}>
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-b from-gold-soft to-gold text-navy"><Icon className="size-5" aria-hidden /></span>
            <span className="cap text-sm font-semibold">{label}</span>
          </div>
        ))}

        <div className="relative flex h-full flex-col justify-center px-14 pb-28 pt-12 xl:px-20">
          <div className="l-rise relative w-fit">
            {/* orbit + titik emas mengelilingi logo */}
            <span className="l-spin-fast absolute -inset-8 rounded-full border border-dashed border-gold/50" aria-hidden>
              <i className="absolute -top-1.5 left-1/2 size-3 rounded-full bg-gold shadow-[0_0_14px_3px_rgb(217_169_58/.8)]" />
            </span>
            <span className="l-spin-rev absolute -inset-16 rounded-full border border-white/10" aria-hidden>
              <i className="absolute -right-1 top-1/2 size-2 rounded-full bg-white/80" />
            </span>
            <AnimatedLogo width={210} loop />
          </div>
          <p className="l-rise mt-14 text-xs font-bold uppercase tracking-[.3em] text-gold" style={{ animationDelay: ".15s" }}>
            National Cultural Risk Intelligence
          </p>
          <h1 className="l-rise cap mt-4 text-5xl font-extrabold leading-[1.1] xl:text-6xl" style={{ animationDelay: ".3s" }}>
            Merawat Warisan,
            <br />
            <span className="l-shine bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">Membaca Risikonya.</span>
          </h1>
          <p className="l-rise mt-6 max-w-lg text-lg leading-relaxed text-white/80" style={{ animationDelay: ".45s" }}>
            Platform terpadu untuk memantau kondisi objek kebudayaan, mendeteksi dini ancaman, dan mendukung keputusan pelestarian berbasis data.
          </p>
          <div className="l-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: ".6s" }}>
            {CHIPS.map((c) => (
              <span key={c} className="cap inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm backdrop-blur">
                <Sparkles className="size-4 text-gold" aria-hidden /> {c}
              </span>
            ))}
          </div>
        </div>
        {/* pita batik bergerak di dasar */}
        <div className="l-batik absolute inset-x-0 bottom-0 h-24 bg-[url('/brand/sidebar/batik-back.webp')] bg-[length:auto_100%] opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-risk-high via-white to-gold" aria-hidden />
      </section>

      {/* Panel kanan: form */}
      <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/60 p-6">
        <div className="l-blob absolute -right-24 -top-24 size-96 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="l-blob absolute -bottom-32 -left-24 size-96 rounded-full bg-sky-300/25 blur-3xl" style={{ animationDelay: "-6s" }} aria-hidden />
        <div className="relative w-full max-w-md">
          <div className="l-rise mb-6 flex items-center gap-4">
            <AnimatedLogo width={72} loop />
            <div className="h-10 w-px bg-slate-300" />
            <div>
              <p className="cap text-xs font-bold tracking-[.25em] text-amber-700">Selamat Datang</p>
              <h1 className="text-3xl font-extrabold text-navy">Masuk ke NCRI</h1>
            </div>
          </div>
          <p className="cap l-rise text-sm text-slate-500" style={{ animationDelay: ".1s" }}>Silakan masuk menggunakan akun resmi Anda untuk melanjutkan.</p>

          <form onSubmit={submit} className="l-rise relative mt-6 space-y-4 overflow-hidden rounded-3xl border border-white bg-white/85 p-7 shadow-2xl shadow-navy/10 backdrop-blur" style={{ animationDelay: ".2s" }}>
            <div className="l-shine absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-risk-high via-gold to-risk-high" aria-hidden />
            <label className="group block text-sm font-semibold text-navy">
              Email
              <span className="relative mt-1.5 block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-gold" aria-hidden />
                <input type="email" required autoComplete="username" placeholder="nama@instansi.go.id" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 font-normal transition-shadow focus:shadow-lg focus:shadow-gold/20 focus:outline-2 focus:outline-gold" />
              </span>
            </label>
            <label className="group block text-sm font-semibold text-navy">
              Kata Sandi
              <span className="relative mt-1.5 block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-gold" aria-hidden />
                <input type={show ? "text" : "password"} required autoComplete="current-password" placeholder="Masukkan kata sandi" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-12 font-normal transition-shadow focus:shadow-lg focus:shadow-gold/20 focus:outline-2 focus:outline-gold" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={show}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 transition hover:scale-110 hover:text-navy">
                  {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </span>
            </label>
            {error && <p role="alert" className="text-sm text-risk-high">{error}</p>}
            <button disabled={busy} className="l-btn-shine relative w-full overflow-hidden btn-gold py-3.5 text-base disabled:opacity-60">
              {busy ? "Masuk…" : "Masuk ke NCRI  →"}
            </button>
            {bio && (
              <>
                <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />atau<span className="h-px flex-1 bg-slate-200" /></div>
                {/* ponytail: belum aktif — butuh backend passkey (WebAuthn: tabel kredensial + verifikasi server) */}
                <button type="button" disabled title="Login biometrik belum diaktifkan"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-navy/20 py-3 text-sm font-semibold text-navy disabled:opacity-60">
                  <Fingerprint className="size-5" aria-hidden /> Masuk dengan Biometrik
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">Segera</span>
                </button>
              </>
            )}
            <p className="flex gap-2 text-xs leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-risk-low" aria-hidden />
              Akses terbatas untuk pengguna yang memiliki otorisasi. Aktivitas pada platform dicatat untuk kebutuhan keamanan dan audit.
            </p>
          </form>
          {DEMO && (
            <div className="mt-5 text-center text-xs text-slate-500">
              Akun demo:
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {DEMO_ROLES.map((r) => (
                  <button key={r} type="button" onClick={() => { setEmail(`${r}@ncri.local`); setPassword("ncri-demo-123"); }}
                    className="rounded-md px-2.5 py-1 font-semibold capitalize ring-1 ring-slate-300 hover:bg-white">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-8 text-center text-xs text-slate-400">© 2026 NCRI · Khusus Penggunaan Internal</p>
        </div>
      </section>
    </main>
  );
}

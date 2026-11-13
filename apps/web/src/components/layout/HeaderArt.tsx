// Latar header: langit senja + pegunungan (vektor SVG, tajam di layar berapa pun), dekoratif murni.
// <HeaderTemple> = siluet Borobudur; ditaruh di area kosong antara judul dan kolom pencarian supaya tidak menutupi form.

export function HeaderArt() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 84" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#0b1f4b" /><stop offset=".55" stopColor="#1d3d78" /><stop offset="1" stopColor="#d98a4a" />
        </linearGradient>
        <radialGradient id="sun" cx="68%" cy="62%" r="30%">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".95" /><stop offset=".25" stopColor="#f6b24a" stopOpacity=".55" /><stop offset="1" stopColor="#f6b24a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stopColor="#0b1f4b" /><stop offset=".3" stopColor="#0b1f4b" stopOpacity=".85" /><stop offset=".6" stopColor="#0b1f4b" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="1000" height="84" fill="url(#sky)" />
      <rect width="1000" height="84" fill="url(#sun)" />
      <path d="M380 84V60l50-14 40 10 60-26 70 28 50-12 80 14 60-18 90 20v22z" fill="#3a5a8f" opacity=".55" />
      <path d="M520 84V64l60-16 50 12 70-22 60 24 60-8 80 10 60-6v24z" fill="#16335f" opacity=".8" />
      <path d="M0 84V72q80-10 160 0t160 0 160-4 160 4 160-6 200 6v12z" fill="#0a1a3c" />
      {/* ornamen batik emas di pojok kanan atas */}
      <g fill="none" stroke="#d9a93a" strokeWidth=".8" opacity=".55">
        {[0, 1, 2, 3].map((i) => <circle key={i} cx={968 - i * 14} cy={8 + (i % 2) * 8} r={9} />)}
        {[0, 1, 2].map((i) => <circle key={i} cx={961 - i * 14} cy={16 + (i % 2) * 8} r={9} />)}
      </g>
      <rect width="1000" height="84" fill="url(#fadeL)" />
    </svg>
  );
}

export function HeaderTemple() {
  const tiers: [number, number, number][] = [[190, 72, 12], [160, 62, 10], [130, 52, 10], [100, 44, 8]]; // lebar, y, tinggi
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 200 84" preserveAspectRatio="xMidYMax meet">
      <g fill="#071636" stroke="#f6b24a" strokeOpacity=".35" strokeWidth=".6">
        {tiers.map(([w, y, h]) => <rect key={y} x={100 - w / 2} y={y} width={w} height={h} />)}
        {[[8, 40], [6, 34], [4, 28]].map(([n, y], r) =>
          Array.from({ length: n }, (_, i) => {
            const span = 92 - r * 18, x = 100 - span / 2 + (span / (n - 1)) * i;
            return <path key={`${r}-${i}`} d={`M${x - 4} ${y}v-5a4 4 0 0 1 8 0v5zM${x} ${y - 9}v-3`} />;
          }))}
        <path d="M88 28v-8a12 12 0 0 1 24 0v8zM100 8V2" />
        <path d="M0 84v-14l8-6 8 6v14zM184 84v-14l8-6 8 6v14z" opacity=".8" />
      </g>
    </svg>
  );
}

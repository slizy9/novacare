/* NOVACARE — illustrations drawn for this app: the body scan, the crew portrait and the mission scenes.
   All vector, so they stay sharp at any size and work with no signal. */

/* ---------- body scan ----------
   A holographic figure with the seven body systems drawn inside it. Each organ takes the colour of its
   status, and each label is a button that selects that system. */
const BODY_HALF = 'M150 70L160 70C160 80 162 84 172 88C186 91 198 94 204 104C212 122 216 150 220 180C224 205 230 235 234 262C237 272 240 284 238 296C236 304 228 304 226 296C224 286 222 276 221 266C215 240 208 215 203 192C199 170 195 148 190 128C190 150 186 172 183 192C181 208 186 224 189 240C193 280 190 320 183 356C186 380 187 408 180 440C176 462 173 474 172 484C176 492 184 498 182 504L160 504C157 498 158 490 159 482C160 450 164 410 160 376C160 340 156 300 150 266Z';
const BODY_LABELS = [
  // id, label, side, label y, dot x, dot y
  ['brain', 'Brain', 'r', 34, 212, 34], ['eyes', 'Eyes', 'l', 50, 201, 49], ['lungs', 'Lungs', 'l', 122, 192, 126],
  ['heart', 'Heart', 'r', 136, 219, 138], ['metabolic', 'Metabolism', 'l', 202, 206, 198], ['immune', 'Immune', 'r', 226, 286, 218],
  ['musculo', 'Bones & muscles', 'r', 322, 233, 318],
];

function bodyModel(sel) {
  const lvl = (id) => Engine.systemLevel(id);
  const cls = (id) => `sys ${lc(lvl(id))} ${sel === id ? 'sel' : ''}`;
  const hr = Engine.status('hr'); const beat = hr.v ? (60 / hr.v).toFixed(2) : 1;
  const labels = BODY_LABELS.map(([id, label, side, y, dx, dy]) => {
    const x = side === 'l' ? 122 : 300; const l = lvl(id); const w = Math.round(label.length * 7.4 + 20);
    return `<g class="lbl ${cls(id)}" data-act="sys" data-id="${id}" tabindex="0" role="button" aria-pressed="${sel === id}" aria-label="${esc(SYS[id].name)}: ${l < 0 ? 'no data' : LEVELS[l].name}">
      <path class="lead" d="M${side === 'l' ? x + 5 : x - 5} ${y}L${dx} ${dy}"/><circle class="pulse" cx="${dx}" cy="${dy}" r="4"/><circle class="pt" cx="${dx}" cy="${dy}" r="3.4"/>
      <rect class="hit" x="${side === 'l' ? x + 9 - w : x - 9}" y="${y - 12}" width="${w}" height="24" rx="12"/>
      <text x="${x}" y="${y + 4}" text-anchor="${side === 'l' ? 'end' : 'start'}">${label}</text></g>`;
  }).join('');
  return `<svg class="bodyscan" viewBox="0 0 420 524" role="group" aria-label="Body scan — choose a body system">
    <defs>
      <linearGradient id="bs-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="0.45" stop-color="#63b1f7"/><stop offset="1" stop-color="#2f78e6"/></linearGradient>
      <radialGradient id="bs-lit" cx="0.5" cy="0.28" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="bs-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <radialGradient id="bs-floor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#4f9bf5" stop-opacity="0.45"/><stop offset="1" stop-color="#4f9bf5" stop-opacity="0"/></radialGradient>
      <clipPath id="bs-clip"><ellipse cx="150" cy="44" rx="21" ry="27"/><path d="${BODY_HALF}"/><path d="${BODY_HALF}" transform="translate(300 0) scale(-1 1)"/></clipPath>
      <filter id="bs-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <ellipse cx="210" cy="502" rx="150" ry="20" fill="url(#bs-floor)"/>
    <g class="floor"><ellipse cx="210" cy="502" rx="118" ry="14"/><ellipse cx="210" cy="502" rx="82" ry="9.5"/><ellipse cx="210" cy="502" rx="46" ry="5"/></g>
    <ellipse class="orbit ${cls('immune')}" cx="210" cy="232" rx="128" ry="30" transform="rotate(-9 210 232)"/>
    <g transform="translate(60 0)">
      <g class="skin"><ellipse cx="150" cy="44" rx="21" ry="27"/><path d="${BODY_HALF}"/><path d="${BODY_HALF}" transform="translate(300 0) scale(-1 1)"/></g>
      <g clip-path="url(#bs-clip)">
        <rect x="40" y="10" width="220" height="230" fill="url(#bs-lit)"/>
        <g class="anat"><path d="M150 92c-14 1-26 3-38 8M150 92c14 1 26 3 38 8"/><path d="M118 132c8 8 22 9 32 2 10 7 24 6 32-2"/><path d="M150 104v152"/>
          <path d="M132 164h36M130 184h40M131 204h38M134 224h32"/><path d="M118 236c10 12 22 22 32 28 10-6 22-16 32-28"/>
          <path d="M112 356c6 6 14 6 20 0M168 356c6 6 14 6 20 0"/><path d="M96 190c4 4 8 4 12 0M192 190c4 4 8 4 12 0"/></g>
        <g class="${cls('musculo')}" filter="url(#bs-glow)"><path class="bone" d="M131 262l-5 84M169 262l5 84M124 372l5 96M176 372l-5 96M110 116l-12 70M190 116l12 70"/>
          <circle cx="131" cy="260" r="4"/><circle cx="169" cy="260" r="4"/><circle cx="125" cy="358" r="5"/><circle cx="175" cy="358" r="5"/></g>
        <g class="${cls('metabolic')}" filter="url(#bs-glow)"><path d="M136 178c10-5 24-5 30 2 5 7 2 16-6 18 6 4 6 14-2 18-8 4-20 3-24-4-3-6 0-11 5-14-7-4-9-14-3-20z"/></g>
        <g class="${cls('lungs')}" filter="url(#bs-glow)"><path d="M146 106c-10 0-19 14-20 40 0 10 13 8 20 2z"/><path d="M154 106c10 0 19 14 20 40 0 10-13 8-20 2z"/></g>
        <g class="${cls('heart')}" filter="url(#bs-glow)"><path class="beat" style="animation-duration:${beat}s" d="M158 150c-9-7-13-12-13-17a6.500 6.500 0 0 1 13-2.500 6.500 6.500 0 0 1 13 2.500c0 5-4 10-13 17z"/></g>
        <g class="${cls('brain')}" filter="url(#bs-glow)"><path d="M150 22c-9 0-16 6-16 13 0 6 5 11 12 12h8c7-1 12-6 12-12 0-7-7-13-16-13z"/><path class="fold" d="M150 23v24M142 28c3 3 3 7 0 10M158 28c-3 3-3 7 0 10"/></g>
        <g class="${cls('eyes')}" filter="url(#bs-glow)"><ellipse cx="142" cy="50" rx="4.500" ry="2.600"/><ellipse cx="158" cy="50" rx="4.500" ry="2.600"/></g>
        <rect class="scan" x="40" y="0" width="220" height="60" fill="url(#bs-scan)"/>
      </g>
      <g class="rim"><ellipse cx="150" cy="44" rx="21" ry="27"/><path d="${BODY_HALF}"/><path d="${BODY_HALF}" transform="translate(300 0) scale(-1 1)"/></g>
    </g>
    <ellipse class="orbit front ${cls('immune')}" cx="210" cy="232" rx="128" ry="30" transform="rotate(-9 210 232)" pathLength="100" stroke-dasharray="50 50"/>
    ${labels}
  </svg>`.replace(/\.(\d)00\b/g, '.$1');
}

/* ---------- crew portrait ----------
   An astronaut in a NovaCare suit; the name tag carries the crew member's initials. */
function crewPortrait(name) {
  const tag = esc(initials(name || 'Crew')).slice(0, 3);
  return `<svg class="portrait" viewBox="0 0 120 128" role="img" aria-label="Crew portrait of ${esc(name || 'crew member')}">
    <defs>
      <linearGradient id="cp-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1440"/><stop offset="1" stop-color="#16327f"/></linearGradient>
      <radialGradient id="cp-earth" cx="0.3" cy="0.2" r="0.9"><stop offset="0" stop-color="#7cc8ff"/><stop offset="0.6" stop-color="#2468d6"/><stop offset="1" stop-color="#0b2a8f"/></radialGradient>
      <linearGradient id="cp-suit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d6ea"/></linearGradient>
      <radialGradient id="cp-shell" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#dfe8f5"/><stop offset="1" stop-color="#a9b9d3"/></radialGradient>
      <linearGradient id="cp-visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b2f7a"/><stop offset="0.55" stop-color="#0a1238"/><stop offset="1" stop-color="#3a1f66"/></linearGradient>
      <clipPath id="cp-vclip"><path d="M37 50c0-15 10-25 23-25s23 10 23 25c0 12-9 20-23 20s-23-8-23-20z"/></clipPath>
    </defs>
    <rect width="120" height="128" fill="url(#cp-sky)"/>
    <g fill="#fff"><circle cx="14" cy="16" r="0.9"/><circle cx="100" cy="12" r="1.100"/><circle cx="108" cy="44" r="0.700"/><circle cx="22" cy="46" r="0.700"/><circle cx="88" cy="26" r="0.600"/><circle cx="8" cy="72" r="0.800"/></g>
    <circle cx="-8" cy="140" r="62" fill="url(#cp-earth)"/><circle cx="-8" cy="140" r="64" fill="none" stroke="#9fd8ff" stroke-width="1.500" opacity="0.6"/>
    <path d="M10 128c2-22 14-34 30-38h40c16 4 28 16 30 38z" fill="url(#cp-suit)"/>
    <path d="M26 128c1-12 4-20 9-26M94 128c-1-12-4-20-9-26" fill="none" stroke="#9fb0cc" stroke-width="1.200"/>
    <rect x="42" y="82" width="36" height="12" rx="6" fill="#b7c5dc"/><rect x="42" y="82" width="36" height="5" rx="2.500" fill="#e9eff8"/>
    <rect x="68" y="103" width="24" height="12" rx="3" fill="#0b2a8f"/><text x="80" y="112" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="8" font-weight="800" fill="#fff" letter-spacing="0.5">${tag}</text>
    <circle cx="40" cy="109" r="8" fill="#fff" stroke="#d5deec"/><path d="M38 103.500h4v3.500h3.500v4H42v3.500h-4V111h-3.500v-4H38z" fill="#ff4f9a"/>
    <circle cx="60" cy="50" r="34" fill="url(#cp-shell)"/><circle cx="60" cy="50" r="34" fill="none" stroke="#8fa2c2" stroke-width="1"/>
    <rect x="23" y="44" width="6" height="14" rx="3" fill="#ff4f9a"/><rect x="91" y="44" width="6" height="14" rx="3" fill="#ff4f9a"/>
    <path d="M37 50c0-15 10-25 23-25s23 10 23 25c0 12-9 20-23 20s-23-8-23-20z" fill="url(#cp-visor)" stroke="#f3c96a" stroke-width="1.400"/>
    <g clip-path="url(#cp-vclip)"><circle cx="46" cy="88" r="30" fill="url(#cp-earth)" opacity="0.85"/><path d="M40 34c8-6 20-7 30-2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
      <path d="M72 40c4 4 6 9 6 14" fill="none" stroke="#ff8fc0" stroke-width="2" stroke-linecap="round" opacity="0.7"/><circle cx="70" cy="46" r="1.200" fill="#fff"/><circle cx="64" cy="56" r="0.700" fill="#fff"/></g>
  </svg>`.replace(/\.(\d)00\b/g, '.$1');
}

/* ---------- mission scenes ---------- */
const ART_DEFS = `<defs>
  <linearGradient id="ma-space" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#050b22"/><stop offset="1" stop-color="#13265a"/></linearGradient>
  <radialGradient id="ma-earth" cx="0.36" cy="0.12" r="0.95"><stop offset="0" stop-color="#8fd4ff"/><stop offset="0.45" stop-color="#2b78dc"/><stop offset="1" stop-color="#06205e"/></radialGradient>
  <radialGradient id="ma-mars" cx="0.34" cy="0.14" r="0.95"><stop offset="0" stop-color="#f3a070"/><stop offset="0.5" stop-color="#c65a32"/><stop offset="1" stop-color="#57200f"/></radialGradient>
  <radialGradient id="ma-moon" cx="0.36" cy="0.1" r="0.95"><stop offset="0" stop-color="#f1f3f6"/><stop offset="0.5" stop-color="#aab2bd"/><stop offset="1" stop-color="#4b525d"/></radialGradient>
  <radialGradient id="ma-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.25" stop-color="#ffe9c2" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
  <radialGradient id="ma-neb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff4f9a" stop-opacity="0.35"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></radialGradient>
  <linearGradient id="ma-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1d3f"/><stop offset="0.6" stop-color="#a6583f"/><stop offset="1" stop-color="#e9a36b"/></linearGradient>
  <linearGradient id="ma-panel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f6fd8"/><stop offset="1" stop-color="#172f7a"/></linearGradient>
  <linearGradient id="ma-hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c6da"/></linearGradient>
</defs>`;
const ART_STARS = '<rect width="320" height="120" fill="url(#ma-space)"/><g fill="#fff"><circle cx="22" cy="18" r="1" opacity=".9"/><circle cx="64" cy="44" r=".7" opacity=".5"/><circle cx="108" cy="12" r="1.100" opacity=".8"/><circle cx="150" cy="30" r=".6" opacity=".5"/><circle cx="196" cy="10" r="1" opacity=".8"/><circle cx="238" cy="38" r=".7" opacity=".6"/><circle cx="282" cy="18" r="1.100" opacity=".8"/><circle cx="306" cy="56" r=".6" opacity=".5"/><circle cx="40" cy="70" r=".6" opacity=".4"/><circle cx="128" cy="58" r=".5" opacity=".5"/><circle cx="262" cy="70" r=".5" opacity=".4"/><circle cx="86" cy="26" r=".5" opacity=".6"/></g>';
const panel = (x, y) => `<g><rect x="${x}" y="${y}" width="18" height="7" fill="url(#ma-panel)" stroke="#9fc0ff" stroke-width=".4"/><path d="M${x + 6} ${y}v7M${x + 12} ${y}v7" stroke="#9fc0ff" stroke-width=".3"/></g>`;
const MISSION_ART = {
  iss: { c: '#4f9fe0', svg: `${ART_STARS}<circle cx="252" cy="62" r="46" fill="url(#ma-sun)"/>
    <circle cx="150" cy="262" r="182" fill="#7fc8ff" opacity=".18"/><circle cx="150" cy="262" r="176" fill="url(#ma-earth)"/>
    <g opacity=".5" fill="#46b08a"><path d="M70 112c12-8 30-10 40-3 9 6 22 3 30 9 6 5-4 12-16 12-14 0-20 8-34 6-14-2-28-16-20-24z"/><path d="M176 100c10-5 28-4 38 4 8 6 22 6 26 14-10 6-26 2-36 4-12 2-30-2-34-10-2-5 0-9 6-12z"/></g>
    <g fill="none" stroke="#fff" stroke-linecap="round" opacity=".55"><path d="M40 118c20-10 44-8 60-2" stroke-width="3"/><path d="M128 104c18-6 40-4 58 3" stroke-width="2.500"/><path d="M214 116c14-5 30-4 44 2" stroke-width="3"/></g>
    <circle cx="150" cy="262" r="177" fill="none" stroke="#bfe6ff" stroke-width="2" opacity=".7"/>
    <g class="art-move"><path d="M186 50h74" stroke="#dfe7f4" stroke-width="2"/>${panel(186, 38)}${panel(186, 55)}${panel(242, 38)}${panel(242, 55)}
      <rect x="210" y="44" width="26" height="11" rx="5" fill="url(#ma-hull)"/><rect x="219" y="34" width="8" height="12" rx="3" fill="url(#ma-hull)"/><rect x="219" y="54" width="8" height="10" rx="3" fill="#cfd8e8"/><circle cx="216" cy="49.500" r="1.300" fill="#ff4f9a"/><circle cx="230" cy="49.500" r="1.300" fill="#7fd0ff"/></g>` },
  transit: { c: '#a78bfa', svg: `${ART_STARS}<ellipse cx="210" cy="40" rx="130" ry="60" fill="url(#ma-neb)"/>
    <circle cx="34" cy="94" r="15" fill="url(#ma-earth)"/><circle cx="34" cy="94" r="16.500" fill="none" stroke="#9fd8ff" stroke-width="1" opacity=".5"/>
    <circle cx="292" cy="26" r="9" fill="url(#ma-mars)"/>
    <path d="M50 88Q160 14 282 28" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 6" opacity=".55"/>
    <g class="art-move"><path d="M96 66l-22 6 22 6z" fill="#7fd0ff" opacity=".8"/><path d="M96 68l-12 4 12 4z" fill="#fff"/>
      <rect x="96" y="65" width="74" height="14" rx="7" fill="url(#ma-hull)"/><path d="M170 65c10 1 18 4 22 7-4 3-12 6-22 7z" fill="#dfe7f4"/>
      <ellipse cx="132" cy="72" rx="7" ry="20" fill="none" stroke="#dfe7f4" stroke-width="3.500"/><rect x="104" y="69" width="18" height="3" rx="1.500" fill="#0b2a8f"/><circle cx="180" cy="72" r="2" fill="#ff4f9a"/>
      ${panel(140, 50)}${panel(140, 87)}</g>` },
  moon: { c: '#b9c2cc', svg: `${ART_STARS}
    <g class="art-move"><circle cx="246" cy="34" r="17" fill="url(#ma-earth)"/><path d="M236 30c5-4 12-4 17 0M240 40c4-2 9-2 13 1" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/><circle cx="246" cy="34" r="18.500" fill="none" stroke="#9fd8ff" stroke-width="1" opacity=".5"/></g>
    <circle cx="150" cy="330" r="250" fill="url(#ma-moon)"/>
    <g fill="#6f7783" opacity=".75"><ellipse cx="78" cy="102" rx="20" ry="5.500"/><ellipse cx="236" cy="108" rx="26" ry="6.500"/><ellipse cx="138" cy="112" rx="9" ry="2.600"/></g>
    <g fill="none" stroke="#fff" opacity=".5"><path d="M58 103c6 5 34 5 40 0" stroke-width="1.200"/><path d="M210 109c8 6 44 6 52 0" stroke-width="1.200"/></g>
    <path d="M150 96c-13 0-22 6-22 12h44c0-6-9-12-22-12z" fill="url(#ma-hull)"/><rect x="146" y="102" width="8" height="6" rx="1" fill="#0b2a8f"/><circle cx="150" cy="93" r="1.500" fill="#ff4f9a"/>
    <path d="M176 108h14v-5h-14z" fill="#cfd8e8"/><path d="M183 103V92" stroke="#dfe7f4" stroke-width="1"/><path d="M183 92l8 2-8 3z" fill="#ff4f9a"/>` },
  mars: { c: '#e2794f', svg: `${ART_STARS}<circle cx="150" cy="240" r="170" fill="#f0a070" opacity=".16"/><circle cx="150" cy="240" r="164" fill="url(#ma-mars)"/>
    <g fill="#6e2a14" opacity=".5"><path d="M64 110c14-10 36-10 50-2 12 6 30 2 40 10-8 8-28 6-40 8-16 2-44-4-50-16z"/><path d="M186 104c12-6 30-2 42 6 8 6 4 12-8 12-14 0-34-6-34-18z"/><ellipse cx="150" cy="96" rx="12" ry="3"/></g>
    <path d="M118 80c10-4 54-4 64 0-8 5-56 5-64 0z" fill="#fff" opacity=".85"/>
    <circle cx="150" cy="240" r="165" fill="none" stroke="#ffc9a8" stroke-width="1.500" opacity=".6"/>
    <g class="art-move"><path d="M44 30c3-2 7-2 9 0 2 2 1 5-2 6-3 1-7 0-8-2-1-1 0-3 1-4z" fill="#b9b2a8"/><circle cx="74" cy="18" r="2.200" fill="#b9b2a8"/></g>` },
  rover: { c: '#e0a13c', svg: `<rect width="320" height="120" fill="url(#ma-dusk)"/><circle cx="262" cy="52" r="34" fill="url(#ma-sun)"/><circle cx="262" cy="52" r="5" fill="#fff" opacity=".9"/>
    <path d="M0 78l34-14 26 8 22-12h40l18 14 40-6 30-16 28 8 30-10 52 18v52H0z" fill="#6b3524" opacity=".85"/>
    <path d="M0 92q60-16 120-6t110-8 90 10v32H0z" fill="#8a4a2e"/><path d="M0 106q80-10 170-4t150-4v22H0z" fill="#5d2f1c"/>
    <path d="M0 110q60-4 108-3M180 104q60-3 140 0" fill="none" stroke="#3d1e12" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>
    <g class="art-move"><rect x="118" y="76" width="52" height="16" rx="5" fill="url(#ma-hull)"/><path d="M158 76l10-10h14l6 10z" fill="#dfe7f4"/><path d="M162 75l7-7h10l4 7z" fill="#7fd0ff"/>
      <path d="M128 76V60" stroke="#dfe7f4" stroke-width="1.500"/><rect x="118" y="56" width="22" height="5" fill="url(#ma-panel)" stroke="#9fc0ff" stroke-width=".4"/><circle cx="174" cy="84" r="1.500" fill="#ff4f9a"/>
      <g fill="#1d2230" stroke="#dfe7f4" stroke-width="1.500"><circle cx="126" cy="96" r="6"/><circle cx="145" cy="96" r="6"/><circle cx="164" cy="96" r="6"/><circle cx="183" cy="94" r="6"/></g></g>` },
};
function missionArt(k) { return `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ART_DEFS}${(MISSION_ART[k] || MISSION_ART.iss).svg}</svg>`.replace(/\.(\d)00\b/g, '.$1'); }

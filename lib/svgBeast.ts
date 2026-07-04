import { generateBeastTraits, type BeastBody, type BeastTraits } from "@/lib/beastTraits";
import { escapeXml, seedByte, seedInt } from "@/lib/hash";

export function generateBeastSVG(traits: BeastTraits): string {
  const id = traits.seed.slice(2, 10);
  const beast = renderBody(traits.body, traits);
  const hornLayer = renderHorns(traits);
  const eyeLayer = renderEyes(traits);
  const auraLayer = renderAura(traits);
  const tokenLabel = traits.prompt ? `SEED ${id.toUpperCase()}` : "SEED UNKNOWN";
  const name = escapeXml(traits.name);
  const rarity = escapeXml(traits.rarity);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="${name}">
<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="72%">
    <stop offset="0%" stop-color="${traits.palette.secondary}"/>
    <stop offset="58%" stop-color="${traits.palette.background}"/>
    <stop offset="100%" stop-color="#020208"/>
  </radialGradient>
  <linearGradient id="body" x1="20%" x2="80%" y1="16%" y2="94%">
    <stop offset="0%" stop-color="${traits.palette.glow}"/>
    <stop offset="44%" stop-color="${traits.palette.primary}"/>
    <stop offset="100%" stop-color="${traits.palette.secondary}"/>
  </linearGradient>
  <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="18" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
  <filter id="hardGlow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${traits.palette.glow}" flood-opacity="0.8"/>
  </filter>
</defs>
<rect width="1024" height="1024" fill="url(#bg)"/>
${renderStars(traits)}
<circle cx="512" cy="444" r="318" fill="none" stroke="${traits.palette.primary}" stroke-opacity="0.20" stroke-width="3"/>
<circle cx="512" cy="444" r="238" fill="none" stroke="${traits.palette.accent}" stroke-opacity="0.13" stroke-width="2" stroke-dasharray="18 18"/>
${auraLayer}
<g filter="url(#softGlow)" opacity="0.24">
  <ellipse cx="512" cy="540" rx="250" ry="300" fill="${traits.palette.primary}"/>
</g>
<g filter="url(#hardGlow)">
  ${hornLayer}
  ${beast}
  ${eyeLayer}
</g>
<rect x="104" y="782" width="816" height="146" rx="36" fill="#070712" fill-opacity="0.76" stroke="${traits.palette.primary}" stroke-opacity="0.35"/>
<text x="138" y="842" fill="#f8fafc" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="800" letter-spacing="0">${name}</text>
<text x="138" y="890" fill="${traits.palette.accent}" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="3">MONBEAST ARENA</text>
<rect x="724" y="814" width="154" height="42" rx="21" fill="${traits.palette.primary}" fill-opacity="0.26" stroke="${traits.palette.glow}" stroke-opacity="0.5"/>
<text x="801" y="842" text-anchor="middle" fill="#ffffff" font-family="Inter,Arial,sans-serif" font-size="20" font-weight="800" letter-spacing="2">${rarity}</text>
<text x="724" y="892" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="2">${tokenLabel}</text>
</svg>`;
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateBeastImageDataUri(prompt: string, tokenId?: number | string): string {
  return svgToDataUri(generateBeastSVG(generateBeastTraits(prompt, tokenId)));
}

export function createPlaceholderBeastSvg(seed = "MonBeast") {
  return generateBeastImageDataUri(seed);
}

function renderBody(body: BeastBody, traits: BeastTraits) {
  const stroke = traits.palette.accent;
  const claw = traits.palette.glow;

  if (body === "Serpent") {
    return `<path d="M376 666c128 14 252-34 260-122 5-61-57-94-118-112-52-16-92-37-82-76 10-41 84-54 150-25" fill="none" stroke="url(#body)" stroke-width="118" stroke-linecap="round"/>
<path d="M626 315l88-44-25 98z" fill="${stroke}"/>
<path d="M652 335l98 10-74 61z" fill="${traits.palette.primary}"/>
<ellipse cx="650" cy="328" rx="94" ry="72" fill="url(#body)"/>`;
  }

  if (body === "Mech" || body === "Golem") {
    return `<path d="M370 418l70-96h144l70 96-48 248H418z" fill="url(#body)" stroke="${stroke}" stroke-opacity="0.55" stroke-width="8"/>
<rect x="416" y="454" width="192" height="138" rx="34" fill="#050816" fill-opacity="0.42"/>
<path d="M310 516l96-58 18 80-78 96z" fill="url(#body)"/>
<path d="M714 516l-96-58-18 80 78 96z" fill="url(#body)"/>
<path d="M430 666l-34 118h78l38-112z" fill="${claw}" fill-opacity="0.82"/>
<path d="M594 666l34 118h-78l-38-112z" fill="${claw}" fill-opacity="0.82"/>`;
  }

  if (body === "Wraith") {
    return `<path d="M512 292c118 34 180 145 148 270-22 87-85 150-104 236l-44-74-58 78-18-94-80 58c28-82-24-160-16-254 9-115 74-189 172-220z" fill="url(#body)"/>
<path d="M376 520c64 44 198 40 270-2" fill="none" stroke="${stroke}" stroke-opacity="0.45" stroke-width="8"/>`;
  }

  if (body === "Tiger") {
    return `<ellipse cx="512" cy="520" rx="178" ry="214" fill="url(#body)"/>
<path d="M360 378l-74-86 122 26z" fill="url(#body)"/>
<path d="M664 378l74-86-122 26z" fill="url(#body)"/>
<path d="M404 434l-74 22M430 510l-90 10M620 434l74 22M594 510l90 10" stroke="#050816" stroke-opacity="0.55" stroke-width="18" stroke-linecap="round"/>
<path d="M438 652c48 34 98 34 148 0" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>`;
  }

  if (body === "Frog") {
    return `<ellipse cx="512" cy="546" rx="198" ry="170" fill="url(#body)"/>
<circle cx="404" cy="398" r="82" fill="url(#body)"/>
<circle cx="620" cy="398" r="82" fill="url(#body)"/>
<path d="M338 632c-64 22-95 62-94 122M686 632c64 22 95 62 94 122" stroke="${claw}" stroke-width="28" stroke-linecap="round"/>
<path d="M420 630c58 46 126 46 184 0" fill="none" stroke="#050816" stroke-opacity="0.58" stroke-width="16" stroke-linecap="round"/>`;
  }

  if (body === "Demon" || body === "Drake") {
    return `<path d="M512 292c104 0 190 94 190 246 0 146-74 236-190 236s-190-90-190-236c0-152 86-246 190-246z" fill="url(#body)"/>
<path d="M344 462l-138-78 58 174z" fill="url(#body)" opacity="0.92"/>
<path d="M680 462l138-78-58 174z" fill="url(#body)" opacity="0.92"/>
<path d="M462 670c34 28 66 28 100 0" fill="none" stroke="${stroke}" stroke-width="16" stroke-linecap="round"/>`;
  }

  return `<ellipse cx="512" cy="524" rx="176" ry="226" fill="url(#body)"/>
<path d="M378 474l-92-58 42 132zM646 474l92-58-42 132z" fill="url(#body)"/>`;
}

function renderEyes(traits: BeastTraits) {
  const eyeColor = traits.eyes === "Void" ? "#050816" : traits.palette.accent;
  const slit = traits.eyes === "Feral" || traits.eyes === "Laser";
  const extra =
    traits.eyes === "Circuit"
      ? `<path d="M412 508h-48v-34M612 508h48v-34" stroke="${traits.palette.accent}" stroke-width="8" fill="none" stroke-linecap="round"/>`
      : "";

  return `<g>
  <ellipse cx="434" cy="496" rx="48" ry="25" fill="${eyeColor}"/>
  <ellipse cx="590" cy="496" rx="48" ry="25" fill="${eyeColor}"/>
  ${
    slit
      ? `<rect x="428" y="471" width="12" height="50" rx="6" fill="#020208"/><rect x="584" y="471" width="12" height="50" rx="6" fill="#020208"/>`
      : ""
  }
  ${extra}
</g>`;
}

function renderHorns(traits: BeastTraits) {
  if (traits.horns === "None") {
    return "";
  }
  if (traits.horns === "Halo") {
    return `<ellipse cx="512" cy="270" rx="128" ry="36" fill="none" stroke="${traits.palette.accent}" stroke-width="14" opacity="0.8"/>`;
  }
  if (traits.horns === "Crown") {
    return `<path d="M390 326l46-112 76 104 76-104 46 112z" fill="${traits.palette.accent}" opacity="0.9"/>`;
  }
  if (traits.horns === "Blade") {
    return `<path d="M420 330l-30-154 88 126zM604 330l30-154-88 126z" fill="${traits.palette.accent}" opacity="0.88"/>`;
  }

  return `<path d="M402 334c-72-42-84-104-50-168 58 40 90 92 88 150zM622 334c72-42 84-104 50-168-58 40-90 92-88 150z" fill="${traits.palette.accent}" opacity="0.85"/>`;
}

function renderAura(traits: BeastTraits) {
  if (traits.aura === "Lightning") {
    return `<path d="M276 336l72 52-58 28 92 86M748 336l-72 52 58 28-92 86" fill="none" stroke="${traits.palette.accent}" stroke-width="12" stroke-linecap="round" opacity="0.76"/>`;
  }
  if (traits.aura === "Runes") {
    return `<g fill="${traits.palette.accent}" opacity="0.58">
${Array.from({ length: 12 }, (_, i) => {
  const angle = (Math.PI * 2 * i) / 12;
  const x = Math.round(512 + Math.cos(angle) * 318);
  const y = Math.round(444 + Math.sin(angle) * 318);
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="serif" font-size="30">*</text>`;
}).join("")}
</g>`;
  }
  if (traits.aura === "Plasma" || traits.aura === "Void") {
    return `<g fill="none" stroke="${traits.palette.glow}" stroke-width="8" opacity="0.32">
  <path d="M230 530c88-190 476-190 564 0"/>
  <path d="M266 650c122 128 370 128 492 0"/>
</g>`;
  }

  return `<g fill="${traits.palette.primary}" opacity="0.18">
  <ellipse cx="262" cy="534" rx="44" ry="130"/>
  <ellipse cx="762" cy="534" rx="44" ry="130"/>
  <ellipse cx="512" cy="250" rx="180" ry="42"/>
</g>`;
}

function renderStars(traits: BeastTraits) {
  return Array.from({ length: 42 }, (_, i) => {
    const x = 70 + (seedInt(traits.seed, 10 + i, 2) % 884);
    const y = 62 + (seedInt(traits.seed, 52 + i, 2) % 620);
    const r = 1 + (seedByte(traits.seed, 96 + i) % 3);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="${0.18 + r * 0.08}"/>`;
  }).join("");
}

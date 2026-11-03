import sharp from "sharp";
// The site logo (see src/components/SiteHeader.astro), as SVG source.
import logoSvg from "../assets/brand/logo-c-solid.svg?raw";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const SURFACE = "#070d1a";
const INK = "#e2e8f0";
const MUTED = "#94a3b8";
const ACCENT = "#2dd4bf";
const LINE = "#1e293b";

export interface OgText {
  name: string;
  headline: string;
  tagline: string;
}

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

/**
 * The Open Graph image (1200×630 PNG): the logo on the site's dark surface,
 * with the name, headline and a tagline. Rendered at build time.
 */
export async function renderOgImage(
  text: OgText,
): Promise<Uint8Array<ArrayBuffer>> {
  const logo = logoSvg
    // Nest the logo as an inner <svg> placed on the card.
    .replace("<svg ", '<svg x="96" y="155" width="320" height="320" ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="100%" height="100%" fill="${SURFACE}"/>
  <g fill="none" stroke="${LINE}" stroke-width="3" stroke-linejoin="round">
    <path d="M0 80 H260 L320 140 H520"/>
    <path d="M1200 560 H980 L920 500 H760"/>
    <path d="M1200 90 H1060 L1000 150 H900"/>
  </g>
  <rect x="0" y="${OG_HEIGHT - 12}" width="100%" height="12" fill="${ACCENT}"/>
  ${logo}
  <g font-family="Inter, Helvetica, Arial, sans-serif">
    <text x="480" y="270" font-size="68" font-weight="700" fill="${INK}">${escape(text.name)}</text>
    <text x="480" y="340" font-size="36" fill="${ACCENT}">${escape(text.headline)}</text>
    <text x="480" y="410" font-size="28" fill="${MUTED}">${escape(text.tagline)}</text>
  </g>
</svg>`;

  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

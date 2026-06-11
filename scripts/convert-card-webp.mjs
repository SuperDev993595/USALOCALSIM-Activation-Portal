/**
 * Convert doc/card-design-*.png → public/images/*.webp for redeem background.
 * Run: node scripts/convert-card-webp.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_WIDTH = 900;
const QUALITY = 84;

async function convert(name) {
  const input = path.join(ROOT, "doc", `${name}.png`);
  const output = path.join(ROOT, "public", "images", `${name}.webp`);

  if (!fs.existsSync(input)) {
    console.warn(`Skip ${name}: missing ${input}`);
    return;
  }

  const meta = await sharp(input).metadata();
  const width = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH);

  await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 6 }).toFile(output);

  const inSize = fs.statSync(input).size;
  const outSize = fs.statSync(output).size;
  console.log(`${name}: ${(inSize / 1024).toFixed(0)} KB → ${(outSize / 1024).toFixed(0)} KB (width ${width})`);
}

for (const name of ["card-design-front", "card-design-back"]) {
  await convert(name);
}

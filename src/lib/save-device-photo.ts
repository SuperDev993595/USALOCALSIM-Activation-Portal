import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Max decoded image size (~400 KB). */
const MAX_BYTES = 400_000;

export type SaveDevicePhotoResult = { publicPath: string } | { error: string };

/**
 * Writes a browser data URL (JPEG/PNG/WebP) to public/uploads/device-photo and returns a site-relative URL.
 */
export async function saveDevicePhotoDataUrlToPublic(
  dataUrl: string,
  cwd: string = process.cwd()
): Promise<SaveDevicePhotoResult> {
  const trimmed = dataUrl.trim();
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([a-zA-Z0-9+/=]+)$/i.exec(trimmed);
  if (!m) return { error: "Invalid device photo format." };

  const mime = m[1].toLowerCase();
  const ext = mime === "jpeg" || mime === "jpg" ? "jpg" : mime === "png" ? "png" : "webp";

  let buffer: Buffer;
  try {
    buffer = Buffer.from(m[2], "base64");
  } catch {
    return { error: "Invalid device photo encoding." };
  }
  if (buffer.length === 0) return { error: "Device photo is empty." };
  if (buffer.length > MAX_BYTES) return { error: "Device photo is too large." };

  const dir = path.join(cwd, "public", "uploads", "device-photo");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return { publicPath: `/uploads/device-photo/${filename}` };
}

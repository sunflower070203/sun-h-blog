import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensionsByType = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);
export const maxMediaBytes = 10 * 1024 * 1024;

export function validateMedia(contentType: string, size: number) {
  return allowedTypes.has(contentType) && size > 0 && size <= maxMediaBytes;
}

export function extensionForMediaType(contentType: string) {
  return extensionsByType.get(contentType);
}

export async function storeLocalMedia(input: {
  rootDirectory: string;
  contentType: string;
  bytes: Buffer;
  now?: Date;
  id?: string;
}) {
  const extension = extensionForMediaType(input.contentType);
  if (!extension) throw new Error("Unsupported media type");

  const date = (input.now ?? new Date()).toISOString().slice(0, 10);
  const objectKey = `${date}/${input.id ?? randomUUID()}.${extension}`;
  const destination = join(input.rootDirectory, objectKey);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, input.bytes, { flag: "wx" });
  return { objectKey, url: `/media/${objectKey}` };
}

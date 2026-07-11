import { IMAGE_ACCEPTED_TYPES, IMAGE_MAX_BYTES, IMAGE_MAX_DIMENSION, PINATA_GATEWAY, PINATA_JWT } from "./config";

export class ImageValidationError extends Error {}

/** Loads a File into an HTMLImageElement for canvas processing. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageValidationError("فایل قابل خواندن به‌عنوان تصویر نیست."));
    };
    img.src = url;
  });
}

/**
 * Resizes the image down to IMAGE_MAX_DIMENSION (square logo canvas) and
 * iteratively lowers JPEG/WebP quality until the output is under
 * IMAGE_MAX_BYTES. Most IPFS pinning services and gateways silently choke on
 * multi-MB logos or extreme aspect ratios, so this keeps every upload inside
 * limits that work everywhere.
 */
export async function prepareLogo(file: File): Promise<{ blob: Blob; previewUrl: string }> {
  if (!IMAGE_ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageValidationError("فقط فرمت‌های PNG، JPEG یا WebP پذیرفته می‌شه.");
  }

  const img = await loadImage(file);
  const side = IMAGE_MAX_DIMENSION;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageValidationError("مرورگر از پردازش تصویر پشتیبانی نمی‌کنه.");

  // letterbox onto a transparent square canvas, preserving aspect ratio
  const scale = Math.min(side / img.width, side / img.height, 1) || side / Math.max(img.width, img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.clearRect(0, 0, side, side);
  ctx.drawImage(img, (side - drawW) / 2, (side - drawH) / 2, drawW, drawH);
  URL.revokeObjectURL(img.src);

  let quality = 0.92;
  let blob: Blob | null = null;
  for (let i = 0; i < 8; i++) {
    blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
    if (!blob) break;
    if (blob.size <= IMAGE_MAX_BYTES) break;
    quality -= 0.12;
  }

  if (!blob) throw new ImageValidationError("تبدیل تصویر با خطا مواجه شد.");
  if (blob.size > IMAGE_MAX_BYTES) {
    throw new ImageValidationError(
      `حتی بعد از فشرده‌سازی، حجم تصویر بیشتر از ${(IMAGE_MAX_BYTES / 1_000_000).toFixed(1)}MB شد. یه عکس ساده‌تر امتحان کن.`
    );
  }

  return { blob, previewUrl: URL.createObjectURL(blob) };
}

export interface IpfsUploadResult {
  cid: string;
  gatewayUrl: string;
  uri: string; // ipfs://<cid>
}

/** Uploads a prepared logo blob to Pinata and returns its IPFS CID. */
export async function uploadLogoToIpfs(blob: Blob, filename: string): Promise<IpfsUploadResult> {
  if (!PINATA_JWT) {
    throw new ImageValidationError(
      "کلید IPFS تنظیم نشده (VITE_PINATA_JWT). بدون آپلود لوگو هم می‌تونی توکن رو دیپلوی کنی."
    );
  }

  const form = new FormData();
  form.append("file", blob, filename);
  form.append(
    "pinataMetadata",
    JSON.stringify({ name: filename })
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`آپلود به IPFS شکست خورد (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  const cid = data.IpfsHash;
  return {
    cid,
    gatewayUrl: `${PINATA_GATEWAY}/ipfs/${cid}`,
    uri: `ipfs://${cid}`
  };
}

/** Uploads a small JSON metadata document (name/symbol/image) to IPFS. */
export async function uploadMetadataToIpfs(metadata: Record<string, unknown>): Promise<IpfsUploadResult> {
  if (!PINATA_JWT) {
    throw new ImageValidationError("کلید IPFS تنظیم نشده (VITE_PINATA_JWT).");
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pinataContent: metadata })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`آپلود متادیتا شکست خورد (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  const cid = data.IpfsHash;
  return {
    cid,
    gatewayUrl: `${PINATA_GATEWAY}/ipfs/${cid}`,
    uri: `ipfs://${cid}`
  };
}

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { prepareLogo, uploadLogoToIpfs, type IpfsUploadResult } from "../lib/ipfs";

export function LogoUploader({ onUploaded }: { onUploaded: (result: IpfsUploadResult | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "uploading" | "done" | "error">("idle");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setStatus("processing");
      onUploaded(null);
      try {
        const { blob, previewUrl } = await prepareLogo(file);
        setPreview(previewUrl);
        setStatus("uploading");
        const result = await uploadLogoToIpfs(blob, `${file.name.split(".")[0] || "logo"}.webp`);
        setStatus("done");
        toast.success("لوگو روی IPFS پین شد");
        onUploaded(result);
      } catch (e) {
        setStatus("error");
        toast.error((e as Error).message);
      }
    },
    [onUploaded]
  );

  return (
    <div>
      <p className="mb-2 font-display text-sm font-semibold text-forge-ink">
        لوگوی توکن <span className="font-normal text-forge-faint">(اختیاری)</span>
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragOver ? "border-forge-blue bg-forge-blue/5" : "border-forge-line hover:border-forge-faint/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-forge-bg">
          {preview ? (
            <motion.img
              src={preview}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full w-full object-contain"
              alt="پیش‌نمایش لوگو"
            />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-forge-faint">
              <path
                d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className="text-xs text-forge-faint">
          {status === "idle" && <p>یه عکس بکش اینجا یا کلیک کن — PNG، JPEG یا WebP.</p>}
          {status === "processing" && <p className="text-forge-blue">در حال تغییر اندازه و فشرده‌سازی…</p>}
          {status === "uploading" && <p className="text-forge-blue">در حال پین کردن روی IPFS…</p>}
          {status === "done" && <p className="text-forge-mint">آماده — به توکن وصل می‌شه.</p>}
          {status === "error" && <p className="text-forge-crimson">مشکلی پیش اومد، دوباره امتحان کن.</p>}
          <p className="mt-1 opacity-70">خودکار به مربع ۱۰۲۴×۱۰۲۴ و زیر ۱ مگابایت فشرده می‌شه.</p>
        </div>
      </div>
    </div>
  );
}

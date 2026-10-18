"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  Music,
  Film,
  Replace,
  AlertCircle,
} from "lucide-react";
import {
  uploadToImageKit,
  validateMediaFile,
  getMediaType,
  humanFileSize,
  ACCEPT_STRING,
  type QuestionMedia,
  type UploadProgress,
  type MediaType,
} from "@/lib/media";

/* ── Inline Media Renderer ──────────────────────── */

function MediaPreviewInline({ media }: { media: QuestionMedia }) {
  if (media.type === "image") {
    return (
      <img
        src={media.url}
        alt={media.name || "Attached image"}
        className="w-full max-h-64 object-contain rounded-xl border-2 border-ink/20 bg-paper"
      />
    );
  }
  if (media.type === "audio") {
    return (
      <audio
        controls
        preload="metadata"
        className="w-full rounded-xl"
        src={media.url}
      >
        <a href={media.url} target="_blank" rel="noreferrer">
          Play audio
        </a>
      </audio>
    );
  }
  if (media.type === "video") {
    return (
      <video
        controls
        preload="metadata"
        className="w-full max-h-64 rounded-xl border-2 border-ink/20 bg-black"
        src={media.url}
      >
        <a href={media.url} target="_blank" rel="noreferrer">
          Play video
        </a>
      </video>
    );
  }
  return null;
}

/* ── Type Icons ─────────────────────────────────── */

const typeIcons: Record<MediaType, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  audio: Music,
  video: Film,
};

/* ── Main Component ─────────────────────────────── */

interface QuestionMediaUploadProps {
  /** Currently attached media (already uploaded URL) */
  media?: QuestionMedia[];
  /** Called when media is uploaded or removed */
  onChange: (media: QuestionMedia[] | undefined) => void;
}

export default function QuestionMediaUpload({
  media,
  onChange,
}: QuestionMediaUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const currentMedia = media?.[0] ?? null;

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateMediaFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const mediaType = getMediaType(file);
      if (!mediaType) return;

      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percent: 0 });

      try {
        const url = await uploadToImageKit(file, (p) => setProgress(p));
        const uploaded: QuestionMedia = {
          url,
          type: mediaType,
          name: file.name,
          size: file.size,
        };
        onChange([uploaded]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Upload failed. Please retry.",
        );
      } finally {
        setUploading(false);
        setProgress(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [onChange],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Render: Uploading state ──────────────────── */
  if (uploading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-paper border-2 border-ink/20 rounded-[14px]">
        <Loader2 className="w-5 h-5 animate-spin text-pink shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[0.78rem] font-bold text-ink truncate">
            Uploading media...
          </p>
          {progress && (
            <div className="mt-1.5">
              <div className="h-1.5 bg-paper rounded-full overflow-hidden border border-ink/10">
                <div
                  className="h-full bg-pink transition-[width] duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[0.66rem] font-dm-mono text-muted mt-1">
                {progress.percent}%{" "}
                {progress.total > 0 && `· ${humanFileSize(progress.loaded)} / ${humanFileSize(progress.total)}`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Render: Media attached ───────────────────── */
  if (currentMedia) {
    const Icon = typeIcons[currentMedia.type] ?? ImageIcon;
    return (
      <div className="space-y-2">
        <div className="relative rounded-[14px] border-2 border-ink/20 bg-white p-3 space-y-2">
          <MediaPreviewInline media={currentMedia} />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="w-4 h-4 text-muted shrink-0" />
              <span className="text-[0.72rem] font-bold text-ink truncate max-w-[200px]">
                {currentMedia.name || "Attached media"}
              </span>
              {currentMedia.size && (
                <span className="text-[0.66rem] font-dm-mono text-muted shrink-0">
                  {humanFileSize(currentMedia.size)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 text-[0.7rem] font-bold text-ink bg-paper border border-ink rounded-lg hover:bg-white cursor-pointer transition-colors"
              >
                <Replace className="w-3 h-3" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-muted hover:text-pink hover:bg-pink/10 rounded-lg cursor-pointer transition-colors"
                aria-label="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_STRING}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  /* ── Render: Empty dropzone ───────────────────── */
  return (
    <div className="space-y-1.5">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`group flex items-center gap-3 p-3 border-2 border-dashed rounded-[14px] cursor-pointer transition-all ${
          dragging
            ? "border-pink bg-pink/5 ring-2 ring-pink"
            : "border-ink/20 bg-paper hover:bg-white hover:border-ink/40"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-pink/10 text-pink flex items-center justify-center shrink-0">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[0.78rem] font-bold text-ink">
            Attach media{" "}
            <span className="font-normal text-muted">(optional)</span>
          </p>
          <p className="text-[0.66rem] font-dm-mono text-muted">
            Image up to 5MB · Audio up to 15MB · Video up to 50MB
          </p>
        </div>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-[0.75rem] text-pink font-medium px-1">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export { MediaPreviewInline };

"use client";

import { Image as ImageIcon, Music, Film } from "lucide-react";

/** Media item shape – matches both QuestionMedia from media.ts and the raw API shape. */
interface MediaItem {
  url: string;
  type?: string;
  name?: string;
}

/** Infer media type from URL when `type` is missing. */
function inferType(url: string, type?: string): "image" | "audio" | "video" | null {
  if (type === "image" || type === "audio" || type === "video") return type;
  const lower = url.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|svg|bmp|ico)(\?|$)/i.test(lower)) return "image";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(lower)) return "audio";
  if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(lower)) return "video";
  // Default to image for unknown URLs (most common case)
  return "image";
}

/**
 * Renders a list of media items with appropriate players.
 * Used in QuizReview (preview modal) and GameplayQuestion (play page).
 */
export default function QuestionMediaRenderer({
  media,
  compact = false,
}: {
  media: (string | MediaItem)[];
  compact?: boolean;
}) {
  if (!media || media.length === 0) return null;

  return (
    <div className={`space-y-3 ${compact ? "mt-2" : "mt-4"}`}>
      {media.map((item, i) => {
        const url = typeof item === "string" ? item : item?.url;
        const rawType = typeof item === "object" ? item?.type : undefined;
        if (typeof url !== "string" || !/^https?:\/\//i.test(url)) return null;

        const type = inferType(url, rawType);

        if (type === "image") {
          return (
            <img
              key={i}
              src={url}
              alt={
                (typeof item === "object" ? item.name : null) ||
                `Question attachment ${i + 1}`
              }
              loading="lazy"
              decoding="async"
              className={`w-full object-contain rounded-xl border-2 border-ink/20 bg-paper ${
                compact ? "max-h-48" : "max-h-72"
              }`}
            />
          );
        }

        if (type === "audio") {
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-paper border border-ink/20 rounded-xl"
            >
              <Music className="w-5 h-5 text-muted shrink-0" />
              <audio
                controls
                preload="metadata"
                className="w-full min-w-0"
                src={url}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Play audio
                </a>
              </audio>
            </div>
          );
        }

        if (type === "video") {
          return (
            <video
              key={i}
              controls
              preload="metadata"
              className={`w-full rounded-xl border-2 border-ink/20 bg-black ${
                compact ? "max-h-48" : "max-h-72"
              }`}
              src={url}
            >
              <a href={url} target="_blank" rel="noreferrer">
                Play video
              </a>
            </video>
          );
        }

        // Fallback: plain link
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline text-pink font-bold inline-flex items-center gap-1.5"
          >
            <Film className="w-4 h-4" />
            View attachment {i + 1}
          </a>
        );
      })}
    </div>
  );
}

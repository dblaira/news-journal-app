"use client";

import { useEffect, useCallback } from "react";
import { C, fontFamily } from "./WorkoutPage";

interface FormModalProps {
  url: string;
  onClose: () => void;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function getYouTubeEmbedUrl(url: string): string {
  // Handle youtu.be/ID and youtube.com/watch?v=ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
  const longMatch = url.match(/[?&]v=([^&]+)/);
  if (longMatch) return `https://www.youtube.com/embed/${longMatch[1]}?autoplay=1`;
  return url;
}

function isImageUrl(url: string): boolean {
  return /\.(gif|jpg|jpeg|png|webp)(\?|$)/i.test(url);
}

export default function FormModal({ url, onClose }: FormModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [handleKeyDown]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: C.white,
          border: `3px solid ${C.black}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 24,
          fontWeight: 800,
          color: C.black,
          zIndex: 10000,
          fontFamily,
        }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Content area — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 16,
          overflow: "hidden",
          background: C.black,
          border: `3px solid ${C.black}`,
        }}
      >
        {isYouTubeUrl(url) ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe
              src={getYouTubeEmbedUrl(url)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Form reference video"
            />
          </div>
        ) : isImageUrl(url) ? (
          <img
            src={url}
            alt="Form reference"
            style={{ width: "100%", display: "block" }}
          />
        ) : (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe
              src={url}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              title="Form reference"
            />
          </div>
        )}
      </div>
    </div>
  );
}

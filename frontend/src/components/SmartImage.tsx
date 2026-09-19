"use client";

import { useState, useEffect } from "react";

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  onAllErrors?: () => void;
}

export function SmartImage({
  src,
  fallbackSrc,
  alt = "",
  className = "",
  onError,
  onAllErrors,
  ...props
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(src);
    setStage(0);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!src) {
      onError?.(e);
      onAllErrors?.();
      return;
    }

    // Stage 0 -> Stage 1: Try .webp format if it's an .avif file from cdn.atsu.moe
    if (stage === 0 && currentSrc && currentSrc.includes("cdn.atsu.moe") && currentSrc.endsWith(".avif")) {
      const webpUrl = currentSrc.replace(".avif", ".webp");
      setCurrentSrc(webpUrl);
      setStage(1);
      return;
    }

    // Stage 0 or 1 -> Stage 2: Try /api/image/proxy fallback
    if (stage < 2 && src && !currentSrc?.startsWith("/api/image/proxy")) {
      const proxyUrl = `/api/image/proxy?url=${encodeURIComponent(src)}`;
      setCurrentSrc(proxyUrl);
      setStage(2);
      return;
    }

    // Stage 2 -> Stage 3: Try explicit fallbackSrc if provided
    if (stage < 3 && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setStage(3);
      return;
    }

    // Final stage: All fallbacks exhausted
    setStage(4);
    onError?.(e);
    onAllErrors?.();
  };

  if (!currentSrc || stage >= 4) {
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
}

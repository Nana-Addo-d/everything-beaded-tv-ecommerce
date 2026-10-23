"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

export function ProductImage({
  src,
  title,
  priority = false,
}: {
  src?: string;
  title: string;
  priority?: boolean;
}) {
  const [failedSource, setFailedSource] = React.useState<string>();
  return (
    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted/60">
      {src && failedSource !== src ? (
        <Image
          src={src}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 50vw"
          className="object-contain"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <div
          className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground"
          role="img"
          aria-label={`Photo unavailable for ${title}`}
        >
          <ImageOff className="h-7 w-7" aria-hidden="true" />
          <span className="text-xs">Photo unavailable</span>
        </div>
      )}
    </div>
  );
}

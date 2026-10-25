"use client";
import Image from "next/image";
import { useState } from "react";
import { Icon } from "./icons";
export function ProductImage({
  src,
  name,
  priority = false,
}: {
  src: string | null;
  name: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <div className="product-image">
      {src && failed !== src ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"
          priority={priority}
          onError={() => setFailed(src)}
        />
      ) : (
        <div className="image-placeholder">
          <Icon name="image" size={42} />
          <span>No image yet</span>
        </div>
      )}
    </div>
  );
}

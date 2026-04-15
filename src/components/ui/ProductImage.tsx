'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { ShoppingBag } from 'lucide-react'

interface ProductImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
}

export function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-(--color-elevated)">
        <ShoppingBag className="h-8 w-8 text-(--color-text-muted)" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  )
}

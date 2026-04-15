interface ProductSchemaProps {
  product: {
    name: string;
    description: string;
    images: string[];
    brand?: string;
    slug: string;
    price: number;
    inStock: number;
    rating?: number;
    reviewCount?: number;
  };
}

export function ProductSchema({ product }: ProductSchemaProps) {
  const hasReviews =
    product.reviewCount !== undefined && product.reviewCount > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    brand: {
      "@type": "Brand",
      name: product.brand ?? "UK Grocery Store",
    },
    offers: {
      "@type": "Offer",
      url: `https://uk-grocery-store.com/shop/product/${product.slug}`,
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      priceValidUntil: new Date(Date.now() + 86400000 * 30)
        .toISOString()
        .split("T")[0],
      availability:
        product.inStock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "UK Grocery Store",
      },
    },
    ...(hasReviews && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (product.rating ?? 0).toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

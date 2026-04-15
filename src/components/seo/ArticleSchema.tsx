interface ArticleSchemaProps {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string;
  authorName?: string;
}

export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  imageUrl,
  authorName,
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    ...(imageUrl && { image: imageUrl }),
    author: {
      "@type": "Person",
      name: authorName ?? "UK Grocery Store",
    },
    publisher: {
      "@type": "Organization",
      name: "UK Grocery Store",
      logo: {
        "@type": "ImageObject",
        url: "https://uk-grocery-store.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://uk-grocery-store.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

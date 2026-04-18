export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: "UK Grocery Store",
    url: "https://uk-grocery-store.com",
    logo: "https://uk-grocery-store.com/logo.png",
    description:
      "Fresh groceries delivered across the UK. Free delivery over £50.",
    telephone: "+44-XXXX-XXXXXX",
    email: "hello@uk-grocery-store.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 High Street",
      addressLocality: "London",
      postalCode: "SW1A 1AA",
      addressCountry: "GB",
    },
    sameAs: [
      "https://www.facebook.com/ukgrocerystore",
      "https://www.instagram.com/ukgrocerystore",
      "https://twitter.com/ukgrocerystore",
    ],
    priceRange: "£",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "07:00",
        closes: "22:00",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

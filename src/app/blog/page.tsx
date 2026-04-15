import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BlogCategoryFilter } from "./components/BlogCategoryFilter";

export const metadata: Metadata = {
  title: "Food & Lifestyle Blog | UK Grocery Store",
  description:
    "Recipes, tips, and seasonal guides for your kitchen. Discover fresh ideas from our food experts.",
  alternates: { canonical: "https://ukgrocerystore.com/blog" },
};

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: "seasonal-vegetables-guide",
    title: "A Guide to Seasonal Vegetables in the UK",
    excerpt:
      "Discover which vegetables are in season each month and how to make the most of British produce.",
    category: "Guides",
    date: "2026-04-01",
    readTime: "5 min",
    imageUrl: "/images/blog/seasonal-veg.jpg",
  },
  {
    slug: "store-fresh-herbs",
    title: "How to Store Fresh Herbs for Maximum Freshness",
    excerpt:
      "Simple tips to keep your herbs fresh for up to two weeks longer than usual.",
    category: "Tips",
    date: "2026-03-25",
    readTime: "3 min",
    imageUrl: "/images/blog/fresh-herbs.jpg",
  },
  {
    slug: "meal-prep-budget",
    title: "Meal Prep on a Budget: A Week of Healthy Meals",
    excerpt:
      "Plan a full week of nutritious meals without breaking the bank.",
    category: "Recipes",
    date: "2026-03-18",
    readTime: "7 min",
    imageUrl: "/images/blog/meal-prep.jpg",
  },
  {
    slug: "organic-vs-conventional",
    title: "Organic vs Conventional: What's Really Worth It?",
    excerpt:
      "We break down which organic products make a real difference and where you can save.",
    category: "Guides",
    date: "2026-03-10",
    readTime: "6 min",
    imageUrl: "/images/blog/organic.jpg",
  },
  {
    slug: "reduce-food-waste",
    title: "10 Simple Ways to Reduce Food Waste at Home",
    excerpt:
      "Practical tips that save money and help the environment.",
    category: "Sustainability",
    date: "2026-03-05",
    readTime: "4 min",
    imageUrl: "/images/blog/food-waste.jpg",
  },
  {
    slug: "british-cheese-guide",
    title: "The Ultimate Guide to British Cheeses",
    excerpt:
      "From Cheddar to Stilton, explore the best cheeses made in Britain.",
    category: "Guides",
    date: "2026-02-28",
    readTime: "8 min",
    imageUrl: "/images/blog/cheese.jpg",
  },
];

const CATEGORIES = ["All", "Guides", "Tips", "Recipes", "Sustainability"];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) transition-shadow duration-300 hover:shadow-(--shadow-md)">
        {/* Image placeholder */}
        <div className="aspect-[8/5] bg-linear-to-br from-(--brand-primary-light) to-(--color-elevated)" />

        {/* Content */}
        <div className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--brand-primary)">
            {post.category}
          </span>

          <h2 className="mt-2 line-clamp-2 text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-(--brand-primary)">
            {post.title}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm text-(--color-text-secondary)">
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs text-(--color-text-muted)">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{post.readTime} read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return <BlogContent searchParamsPromise={searchParams} />;
}

async function BlogContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ category?: string }>;
}) {
  const { category } = await searchParamsPromise;
  const activeCategory = category ?? "All";

  const filteredPosts =
    activeCategory === "All"
      ? POSTS
      : POSTS.filter((p) => p.category === activeCategory);

  return (
    <section className="py-8 lg:py-12">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog" },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-foreground lg:text-4xl">
            Food & Lifestyle Blog
          </h1>
          <p className="mt-2 text-(--color-text-secondary)">
            Recipes, tips, and seasonal guides for your kitchen.
          </p>
        </div>

        {/* Category filter */}
        <BlogCategoryFilter
          categories={CATEGORIES}
          activeCategory={activeCategory}
        />

        {/* Post grid */}
        {filteredPosts.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-(--color-text-muted)">
              No posts found in this category yet.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}

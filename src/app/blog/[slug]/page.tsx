import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { POSTS, type BlogPost } from "../page";

/* ---------- Article body content ---------- */

const ARTICLE_CONTENT: Record<
  string,
  { paragraphs: string[]; headings: string[] }
> = {
  "seasonal-vegetables-guide": {
    headings: [
      "Why Eat Seasonally?",
      "Spring & Summer Picks",
      "Autumn & Winter Staples",
    ],
    paragraphs: [
      "Eating seasonally is one of the simplest ways to improve the quality of your meals while supporting local farmers. When you buy vegetables at the peak of their season, they are more flavourful, more nutritious, and significantly cheaper than out-of-season imports that have travelled thousands of miles.",
      "In spring, look for asparagus, radishes, and new potatoes. As summer arrives, you will find an abundance of broad beans, courgettes, peas, and tomatoes. These vegetables require minimal preparation, a drizzle of olive oil and a pinch of salt is often all you need.",
      "Autumn brings root vegetables like parsnips, beetroot, and squash, which are perfect for hearty soups and roasts. Winter is the season for leeks, kale, Brussels sprouts, and celeriac. These hardy crops thrive in cooler temperatures and form the backbone of British comfort food.",
      "To make the most of seasonal produce, consider visiting a local farmers market or signing up for a veg box scheme. You will discover varieties you have never tried before, and your meals will taste noticeably better.",
    ],
  },
  "store-fresh-herbs": {
    headings: [
      "The Damp Paper Towel Method",
      "Freezing for Later Use",
      "Growing Your Own",
    ],
    paragraphs: [
      "Fresh herbs can transform a simple dish into something memorable, but they often wilt within days of purchase. The good news is that with a few simple storage techniques, you can extend their life by up to two weeks.",
      "For soft herbs like basil, coriander, and parsley, trim the stems and place them in a glass of water, much like a bouquet of flowers. Cover loosely with a plastic bag and store in the fridge. Change the water every couple of days. Basil is the exception and prefers to sit at room temperature.",
      "Hardy herbs such as rosemary, thyme, and sage do best when wrapped in a slightly damp paper towel and placed inside a sealed container or zip-lock bag in the fridge. This keeps them hydrated without making them soggy.",
      "If you find yourself with more herbs than you can use, chop them finely, mix with a little olive oil, and freeze in ice cube trays. You will have ready-to-use herb portions for months to come.",
    ],
  },
  "meal-prep-budget": {
    headings: [
      "Planning Your Weekly Menu",
      "Shopping Smart",
      "Batch Cooking Tips",
    ],
    paragraphs: [
      "Meal prepping does not have to mean eating the same bland chicken and rice every day. With a bit of planning, you can prepare a week of varied, nutritious meals for under thirty pounds, saving both time and money.",
      "Start by choosing three or four base recipes that share common ingredients. For example, a large batch of roasted vegetables can be used in a grain bowl on Monday, a wrap on Tuesday, and a soup on Wednesday. This reduces waste and simplifies your shopping list.",
      "When shopping, focus on seasonal produce, tinned pulses, frozen vegetables, and whole grains. These are consistently affordable and incredibly versatile. Avoid pre-prepared meals and sauces, which cost more and often contain added sugar and salt.",
      "Dedicate two to three hours on a Sunday to batch cooking. Prepare your grains, roast your vegetables, and portion everything into containers. Label each with the day of the week. Your future self will thank you on those busy weekday evenings.",
    ],
  },
  "organic-vs-conventional": {
    headings: [
      "The Dirty Dozen",
      "Where Organic Matters Less",
      "Making the Right Choice",
    ],
    paragraphs: [
      "The organic food market in the UK has grown significantly, but the higher price tags can be difficult to justify on a family budget. The truth is that some products benefit greatly from organic farming, while for others the difference is negligible.",
      "The so-called Dirty Dozen, a list of fruits and vegetables with the highest pesticide residues, is a good starting point. Strawberries, spinach, apples, and grapes consistently top this list. If you are going to buy organic anywhere, these items offer the most benefit.",
      "On the other hand, produce with thick skins or shells, such as avocados, sweetcorn, pineapples, and onions, generally have very low pesticide levels even when grown conventionally. Your money is better spent elsewhere.",
      "A pragmatic approach is to buy organic for the items that matter most, choose conventional for those with natural protection, and always wash your produce thoroughly. This balanced strategy protects your health without emptying your wallet.",
    ],
  },
  "reduce-food-waste": {
    headings: [
      "Plan Before You Shop",
      "Store Food Correctly",
      "Get Creative with Leftovers",
    ],
    paragraphs: [
      "UK households throw away approximately 6.6 million tonnes of food every year, and around 4.5 million tonnes of that is food that could have been eaten. Reducing food waste saves money and has a meaningful impact on the environment.",
      "The most effective strategy is to plan your meals for the week and write a shopping list before you leave the house. Check what you already have in the fridge and cupboards. Stick to your list in the store, and avoid impulse buys driven by promotions on items you do not need.",
      "Proper storage makes a huge difference. Keep your fridge at 3 to 5 degrees Celsius. Store fruits and vegetables in the correct drawers. Learn which items should stay out of the fridge entirely, such as tomatoes, bananas, and potatoes.",
      "When you do end up with leftovers, get creative. Overripe bananas become banana bread. Stale bread becomes breadcrumbs or croutons. Vegetable scraps can be simmered into a flavourful stock. With a bit of imagination, very little needs to go in the bin.",
    ],
  },
  "british-cheese-guide": {
    headings: [
      "The Classics",
      "Regional Specialities",
      "Pairing and Serving",
    ],
    paragraphs: [
      "Britain produces over 700 named cheeses, more than France, yet many people stick to the same supermarket cheddar. Exploring the full range of British cheese is a delicious journey through the country's regions and traditions.",
      "Start with the classics. A mature West Country Farmhouse Cheddar has a deep, complex flavour worlds apart from mass-produced blocks. Stilton, often called the King of English Cheeses, offers a rich, creamy blue with a distinctive tang. And Red Leicester, with its russet hue and mellow nuttiness, deserves far more attention than it receives.",
      "Each region has its specialities. The Yorkshire Wensleydale is famously paired with fruitcake. Stinking Bishop from Gloucestershire is washed in perry and has a pungent aroma but a surprisingly gentle flavour. Cornish Yarg is wrapped in nettles, giving it a unique earthy character.",
      "When serving a cheese board, bring your cheeses to room temperature at least an hour before serving. Include a variety of textures and strengths. Pair with crusty bread, oatcakes, chutney, and fresh fruit. A good cheese board tells a story, make yours a British one.",
    ],
  },
};

/* ---------- Helpers ---------- */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getRelatedPosts(currentSlug: string): BlogPost[] {
  return POSTS.filter((p) => p.slug !== currentSlug).slice(0, 3);
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ---------- Metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | UK Grocery Store Blog`,
    description: post.excerpt,
    alternates: { canonical: `https://ukgrocerystore.com/blog/${slug}` },
  };
}

/* ---------- Page ---------- */

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const content = ARTICLE_CONTENT[slug];
  const related = getRelatedPosts(slug);

  return (
    <section className="py-8 lg:py-12">
      <Container size="md">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
          className="mb-6"
        />

        {/* Article header */}
        <header className="py-8 text-center">
          <span className="inline-block rounded-full bg-(--brand-primary)/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-(--brand-primary)">
            {post.category}
          </span>

          <h1 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-(--color-text-muted)">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{post.readTime} read</span>
            <span aria-hidden="true">&middot;</span>
            <span>UK Grocery Team</span>
          </div>
        </header>

        {/* Hero image placeholder */}
        <div className="aspect-[7/3] overflow-hidden rounded-2xl bg-linear-to-br from-(--brand-primary-light) to-(--color-elevated)" />

        {/* Article body */}
        <article className="mx-auto max-w-2xl py-8">
          {content ? (
            <>
              <p className="mb-4 text-base leading-relaxed text-(--color-text-secondary)">
                {content.paragraphs[0]}
              </p>

              {content.headings.map((heading, i) => (
                <div key={heading}>
                  <h2 className="mt-8 mb-3 font-display text-xl font-semibold text-foreground">
                    {heading}
                  </h2>
                  <p className="mb-4 text-base leading-relaxed text-(--color-text-secondary)">
                    {content.paragraphs[i + 1]}
                  </p>
                </div>
              ))}
            </>
          ) : (
            <p className="text-base leading-relaxed text-(--color-text-secondary)">
              {post.excerpt}
            </p>
          )}
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <aside className="border-t border-(--color-border) pt-10 pb-4">
            <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">
              Related Articles
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((relPost) => (
                <Link
                  key={relPost.slug}
                  href={`/blog/${relPost.slug}`}
                  className="group"
                >
                  <article className="overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) transition-shadow duration-300 hover:shadow-(--shadow-md)">
                    <div className="aspect-[8/5] bg-linear-to-br from-(--brand-primary-light) to-(--color-elevated)" />
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-(--brand-primary)">
                        {relPost.category}
                      </span>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-(--brand-primary)">
                        {relPost.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-xs text-(--color-text-muted)">
                        <time dateTime={relPost.date}>
                          {formatDateShort(relPost.date)}
                        </time>
                        <span aria-hidden="true">&middot;</span>
                        <span>{relPost.readTime} read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </Container>
    </section>
  );
}

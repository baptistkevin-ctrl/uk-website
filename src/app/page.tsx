import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { HeroSection } from "@/components/sections/HeroSection";
import { CategoryGrid } from "@/components/sections/CategoryGrid";
import { DealOfTheDay } from "@/components/sections/DealOfTheDay";
import { BestSellersCarousel } from "@/components/sections/BestSellersCarousel";
import { FreshProduceFeature } from "@/components/sections/FreshProduceFeature";
import { TrustBar } from "@/components/sections/TrustBar";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { SmartReorderSection } from "@/components/smart-reorder/SmartReorderSection";
import { RecipeCarousel } from "@/components/sections/RecipeCarousel";
import { PersonalizedSection } from "@/components/sections/PersonalizedSection";
import { WeatherPromoBanner } from "@/components/weather/WeatherPromoBanner";
import { StatsBar } from "@/components/sections/StatsBar";
import { BrandsMarquee } from "@/components/sections/BrandsMarquee";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { AppDownloadBanner } from "@/components/sections/AppDownloadBanner";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import { ShopByMood } from "@/components/sections/ShopByMood";
import { NewThisWeek } from "@/components/sections/NewThisWeek";
import { CategoryBubbles } from "@/components/mobile/CategoryBubbles";
import { BuyAgainBar } from "@/components/mobile/BuyAgainBar";
import { RecentlyViewedBar } from "@/components/mobile/RecentlyViewedBar";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "UK Grocery Store — Fresh Food Delivered to Your Door",
  description:
    "Shop fresh produce, meat, dairy, bakery, and pantry essentials online. Free delivery on orders over £50. Same-day and next-day delivery across the UK.",
  openGraph: {
    title: "UK Grocery Store — Fresh Food Delivered",
    description:
      "Shop fresh groceries online with free delivery over £50. Same-day and next-day delivery across the UK.",
    type: "website",
    url: "https://uk-grocery-store.com",
  },
};

export default async function HomePage() {
  const supabase = getSupabaseAdmin();

  // Fetch categories
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("display_order", { ascending: true })
    .limit(8);

  const categories = (dbCategories ?? []).map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    imageUrl: cat.image_url ?? undefined,
    itemCount: cat.product_count ?? 0,
  }));

  // Fetch active deal of the day
  const { data: dealData } = await supabase
    .from("flash_deals")
    .select(
      `*, product:products(id, name, slug, price_pence, compare_at_price_pence, image_url)`
    )
    .eq("is_active", true)
    .gt("ends_at", new Date().toISOString())
    .lte("starts_at", new Date().toISOString())
    .order("ends_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const deal = dealData?.product
    ? {
        productName: dealData.product.name,
        productSlug: dealData.product.slug,
        productImageUrl: dealData.product.image_url ?? "",
        originalPrice: (dealData.product.compare_at_price_pence ?? dealData.product.price_pence) / 100,
        dealPrice: (dealData.deal_price_pence ?? dealData.product.price_pence) / 100,
        endsAt: dealData.ends_at,
      }
    : null;

  // Fetch best sellers (top rated products)
  const { data: bestSellers } = await supabase
    .from("products")
    .select("*, vendor:vendors(id, business_name)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(15);

  const bestSellerProducts = (bestSellers ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.image_url ?? "",
    price: (p.price_pence ?? 0) / 100,
    originalPrice: p.compare_at_price_pence
      ? p.compare_at_price_pence / 100
      : undefined,
    rating: p.rating ?? 4.5,
    reviewCount: p.review_count ?? 0,
    category: p.category_name ?? "",
    isOrganic: p.is_organic ?? false,
    onSale: !!p.compare_at_price_pence,
    isNew: p.is_new ?? false,
  }));

  // Fetch fresh produce for feature section — filter by produce/fruit/veg categories
  const { data: freshCatLinks } = await supabase
    .from("product_categories")
    .select("product_id, categories!inner(slug)")
    .in("categories.slug", ["fruits", "vegetables", "salads-herbs", "fresh-produce"]);

  const freshProductIds = [...new Set((freshCatLinks ?? []).map((l) => l.product_id))].slice(0, 5);

  let freshProduce: typeof supabase extends never ? never : any[] = [];
  if (freshProductIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, image_url, price_pence")
      .in("id", freshProductIds)
      .eq("is_active", true)
      .limit(5);
    freshProduce = data ?? [];
  } else {
    // Fallback: search by name keywords
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, image_url, price_pence")
      .eq("is_active", true)
      .or("name.ilike.%tomato%,name.ilike.%carrot%,name.ilike.%spinach%,name.ilike.%apple%,name.ilike.%banana%,name.ilike.%broccoli%,name.ilike.%avocado%,name.ilike.%pepper%")
      .limit(4);
    freshProduce = data ?? [];
  }

  const freshProducts = (freshProduce ?? []).map((p) => ({
    name: p.name,
    slug: p.slug,
    imageUrl: p.image_url ?? "",
    price: (p.price_pence ?? 0) / 100,
  }));

  // Fetch ON SALE products
  const { data: saleProducts } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_pence, compare_at_price_pence, brand, is_organic")
    .eq("is_active", true)
    .not("compare_at_price_pence", "is", null)
    .order("created_at", { ascending: false })
    .limit(15);

  const onSaleItems = (saleProducts ?? []).map((p) => ({
    id: p.id, name: p.name, slug: p.slug,
    imageUrl: p.image_url ?? "",
    pricePence: p.price_pence,
    compareAtPricePence: p.compare_at_price_pence ?? undefined,
    brand: p.brand ?? undefined,
    isOrganic: p.is_organic ?? false,
  }));

  // Fetch ORGANIC products
  const { data: organicProducts } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_pence, compare_at_price_pence, brand, is_organic")
    .eq("is_active", true)
    .eq("is_organic", true)
    .order("created_at", { ascending: false })
    .limit(15);

  const organicItems = (organicProducts ?? []).map((p) => ({
    id: p.id, name: p.name, slug: p.slug,
    imageUrl: p.image_url ?? "",
    pricePence: p.price_pence,
    compareAtPricePence: p.compare_at_price_pence ?? undefined,
    brand: p.brand ?? undefined,
    isOrganic: true,
  }));

  // Fetch BUDGET products (under £2 = 200 pence)
  const { data: budgetProducts } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_pence, compare_at_price_pence, brand, is_organic")
    .eq("is_active", true)
    .lte("price_pence", 200)
    .order("price_pence", { ascending: true })
    .limit(15);

  const budgetItems = (budgetProducts ?? []).map((p) => ({
    id: p.id, name: p.name, slug: p.slug,
    imageUrl: p.image_url ?? "",
    pricePence: p.price_pence,
    compareAtPricePence: p.compare_at_price_pence ?? undefined,
    brand: p.brand ?? undefined,
    isOrganic: p.is_organic ?? false,
  }));

  // Fetch NEW products (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: newProducts } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_pence, created_at")
    .eq("is_active", true)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  const newItems = (newProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    imageUrl: p.image_url ?? "",
    pricePence: p.price_pence,
    daysAgo: Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000),
  }));

  // Fetch ALL PRODUCTS for a full grid section
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_pence, compare_at_price_pence, brand, is_organic")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(30);

  const allItems = (allProducts ?? []).map((p) => ({
    id: p.id, name: p.name, slug: p.slug,
    imageUrl: p.image_url ?? "",
    pricePence: p.price_pence,
    compareAtPricePence: p.compare_at_price_pence ?? undefined,
    brand: p.brand ?? undefined,
    isOrganic: p.is_organic ?? false,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AnnouncementBar />
      <Header />

      <main className="flex-1">
        {/* Section 3: Hero */}
        <HeroSection />

        {/* Mobile Quick Category Bubbles */}
        <CategoryBubbles />

        {/* Buy Again — Quick re-purchase from past orders */}
        <BuyAgainBar />

        {/* AI Smart Reorder — Your Weekly Shop */}
        <SmartReorderSection />

        {/* Dynamic Personalized Content (time/weather/season aware) */}
        <PersonalizedSection />

        {/* Weather-Responsive Merchandising */}
        <WeatherPromoBanner />

        {/* Section 4: Category Grid */}
        <div className="reveal-section">
          {categories.length > 0 && <CategoryGrid categories={categories} />}
        </div>

        {/* Section 5: Deal of the Day */}
        <div className="reveal-section">
          <DealOfTheDay deal={deal} />
        </div>

        {/* New This Week */}
        <div className="reveal-section">
          {newItems.length > 0 && <NewThisWeek products={newItems} />}
        </div>

        {/* Section 6: Best Sellers Carousel */}
        <div className="reveal-section">
          {bestSellerProducts.length > 0 && (
            <BestSellersCarousel products={bestSellerProducts} />
          )}
        </div>

        {/* Recently Viewed — continue where you left off */}
        <RecentlyViewedBar />

        {/* On Sale Products */}
        <div className="reveal-section">
          {onSaleItems.length > 0 && (
            <ProductShowcase
              title="On Sale Now 🏷️"
              subtitle="Grab these deals before they're gone"
              viewAllHref="/products?on_sale=true"
              products={onSaleItems}
              badgeText="SALE"
              badgeColor="bg-(--color-sale)"
            />
          )}
        </div>

        {/* Section 7: Fresh Produce Feature */}
        <div className="reveal-section">
          {freshProducts.length > 0 && (
            <FreshProduceFeature products={freshProducts} />
          )}
        </div>

        {/* Shop by Mood */}
        <div className="reveal-section">
          <ShopByMood />
        </div>

        {/* Organic Range */}
        <div className="reveal-section">
          {organicItems.length > 0 && (
            <ProductShowcase
              title="Organic Range 🌿"
              subtitle="Certified organic from local British farms"
              viewAllHref="/products?is_organic=true"
              products={organicItems}
              badgeText="ORGANIC"
              badgeColor="bg-(--brand-primary)"
            />
          )}
        </div>

        {/* Budget Picks */}
        <div className="reveal-section">
          {budgetItems.length > 0 && (
            <ProductShowcase
              title="Under £2 💰"
              subtitle="Great value picks that won't break the bank"
              viewAllHref="/products?sort=price_asc"
              products={budgetItems}
              badgeText="VALUE"
              badgeColor="bg-(--brand-amber)"
            />
          )}
        </div>

        {/* Recipe-to-Cart Carousel */}
        <div className="reveal-section">
          <RecipeCarousel />
        </div>

        {/* Explore All Products — full grid */}
        <div className="reveal-section">
          {allItems.length > 0 && (
            <ProductShowcase
              title="Explore All Products"
              subtitle="Browse our full range of fresh groceries"
              viewAllHref="/products"
              products={allItems}
              layout="grid"
              columns={5}
            />
          )}
        </div>

        {/* Stats + Trust — cinematic section */}
        <div className="reveal-section">
          <StatsBar />
        </div>

        {/* Why Choose Us */}
        <div className="reveal-section">
          <WhyChooseUs />
        </div>

        {/* Section 9: Testimonials */}
        <div className="reveal-section">
          <TestimonialsSection />
        </div>

        {/* Newsletter CTA */}
        <div className="reveal-section">
          <NewsletterSignup />
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { MiniCart } from "@/components/cart/MiniCart";
import { ProductQuickViewModal } from "@/components/products/product-quick-view-modal";
import { QuickReorder } from "@/components/mobile/QuickReorder";
import { PullToRefreshIndicator } from "@/components/mobile/PullToRefresh";
import { PWAInstallPrompt } from "@/components/mobile/PWAInstallPrompt";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ProactiveChatTrigger } from "@/components/chat/ProactiveChatTrigger";

const ProgressBar = dynamic(
  () => import("@/components/ui/ProgressBar").then((m) => m.ProgressBar),
  { ssr: false }
);

const CustomCursor = dynamic(
  () => import("@/components/ui/CustomCursor").then((m) => m.CustomCursor),
  { ssr: false }
);

export function ClientShell() {
  const pathname = usePathname();

  // Admin and vendor dashboards are separate interfaces
  // Only show toast + progress bar — no shop UI
  const isDashboard = pathname.startsWith("/admin") || pathname.startsWith("/vendor");

  if (isDashboard) {
    return (
      <>
        <ProgressBar />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <ProgressBar />
      <CustomCursor />
      <MiniCart />
      <ProductQuickViewModal />
      <QuickReorder />
      <PullToRefreshIndicator />
      <PWAInstallPrompt />
      <ToastContainer />
      <ScrollToTop />
      <ProactiveChatTrigger />
    </>
  );
}

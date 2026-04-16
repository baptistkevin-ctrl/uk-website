"use client";

import dynamic from "next/dynamic";
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

"use client";

import { Suspense } from "react";
import { MobileFlow } from "@/components/organisms/slot/mobile-flow";

export default function SlotPage() {
  return (
    <Suspense fallback={null}>
      <MobileFlow />
    </Suspense>
  );
}

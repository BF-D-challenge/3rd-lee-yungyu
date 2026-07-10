"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/" + location.search);
  }, [router]);

  return null;
}

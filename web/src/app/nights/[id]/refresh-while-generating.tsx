"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Polls until n8n's callback moves the Night out of generating.
export function RefreshWhileGenerating() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 1_000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 1_000;
const GIVE_UP_AFTER_MS = 2 * 60_000;

// Polls until n8n's callback moves the Night out of generating, then stops after two minutes
// so a lost callback doesn't keep the tab querying forever.
export function RefreshWhileGenerating() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        clearInterval(timer);
        setGaveUp(true);
        return;
      }
      router.refresh();
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return gaveUp ? (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      This is taking longer than usual. Refresh the page to check again.
    </p>
  ) : null;
}

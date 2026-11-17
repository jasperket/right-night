"use client";

import { useSyncExternalStore } from "react";

const format = new Intl.DateTimeFormat("en", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
const noSubscription = () => () => {};

// Formats in the viewer's time zone. The server renders nothing, since its zone may differ.
export function LocalTimeRange({ start, end }: { start: string; end: string }) {
  const text = useSyncExternalStore(
    noSubscription,
    () => `${format.format(new Date(start))} – ${format.format(new Date(end))}`,
    () => null,
  );
  return <time dateTime={start}>{text}</time>;
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { getDb } from "@/db";
import { getNight } from "@/nights/service";
import { generateProposals } from "../actions";
import { RefreshWhileGenerating } from "./refresh-while-generating";

const money = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const time = new Intl.DateTimeFormat("en", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

async function NightView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const night = z.uuid().safeParse(id).success ? await getNight(getDb().db, id) : null;
  if (!night) notFound();

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Status: {night.status}</p>

      {night.status === "collecting" && (
        <form action={generateProposals.bind(null, night.id)}>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Generate
          </button>
        </form>
      )}

      {night.status === "generating" && (
        <>
          <p>Finding plans for your Night…</p>
          <RefreshWhileGenerating />
        </>
      )}

      {night.proposals.length > 0 && (
        <ul className="flex flex-col gap-4">
          {night.proposals.map((proposal) => (
            <li
              key={proposal.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h2 className="text-lg font-semibold">{proposal.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {time.format(proposal.startAt)} – {time.format(proposal.endAt)} · ~
                {money.format(proposal.estCostPp)} per person
              </p>
              <p className="mt-2">{proposal.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function NightPage({ params }: PageProps<"/nights/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Your Night</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NightView params={params} />
      </Suspense>
    </main>
  );
}

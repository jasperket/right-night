import { planNight } from "./nights/actions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Right Night
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Find the right night, together.
      </p>
      <p className="max-w-md text-sm text-zinc-500">
        Date night or squad night, decided.
      </p>
      <form action={planNight}>
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Plan a Night
        </button>
      </form>
    </main>
  );
}

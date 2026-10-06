import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { platformCapabilities } from "@/lib/platform/capabilities";
import { integrations } from "@/lib/integrations/registry";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            AI presentation workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Create, research, design and deliver
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Build research-grounded decks with model routing, collaboration,
            brand controls and multi-format export.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href="/presentation"
          >
            Open presentations
          </Link>
          {session.user.isAdmin && (
            <Link
              className="rounded-md border px-4 py-2 text-sm font-medium"
              href="/admin"
            >
              Admin
            </Link>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(platformCapabilities).map(([group, features]) => (
          <article key={group} className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold capitalize">{group}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Integration surface</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => (
            <div key={integration.id} className="rounded-lg border p-4">
              <div className="font-medium">{integration.name}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {integration.category}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {integration.capabilities.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

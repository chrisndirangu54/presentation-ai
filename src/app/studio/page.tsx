import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { outputCatalog } from "@/lib/outputs/catalog";
import { builtInTemplates } from "@/lib/templates/built-in";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">AI creation studio</p>
        <h1 className="text-4xl font-semibold tracking-tight">Create almost any visual business artifact</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Start from a prompt, data, uploaded research, or a template. Outputs remain structured so charts,
          diagrams and layouts can be edited and exported to multiple formats.
        </p>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Create</h2>
            <p className="text-sm text-muted-foreground">Choose an output type.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/intelligence">Creative intelligence</Link>
            <Link className="underline underline-offset-4" href="/semantic">Semantic canvas</Link>
            <Link className="underline underline-offset-4" href="/adaptive">Adaptive layouts</Link>
            <Link className="underline underline-offset-4" href="/layout-learning">Learned layouts</Link>
            <Link className="underline underline-offset-4" href="/marketplace">Browse marketplace</Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {outputCatalog.map((output) => (
            <article key={output.id} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{output.label}</h3>
                {output.visualFirst && <span className="rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide">Visual</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{output.description}</p>
              <p className="mt-4 text-xs text-muted-foreground">{output.formats.join(" · ").toUpperCase()}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Featured templates</h2>
        <p className="mt-1 text-sm text-muted-foreground">Infographic-heavy starter designs across business, research, data and social use cases.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {builtInTemplates.slice(0, 12).map((template) => (
            <article key={template.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{template.name}</h3>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase">{template.kind}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{template.category}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.tags.map((tag) => <span key={tag} className="rounded-full border px-2 py-1 text-xs">{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

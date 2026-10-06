import Link from "next/link";
import { builtInTemplates } from "@/lib/templates/built-in";

export default function MarketplacePage() {
  const categories = Array.from(new Set(builtInTemplates.map((item) => item.category)));

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Template marketplace</p>
          <h1 className="text-4xl font-semibold tracking-tight">Discover and sell reusable creative systems</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Browse presentation, document, spreadsheet, infographic, diagram, poster and social templates.
            Creator listings can be free or paid, versioned, licensed, reviewed and rated.
          </p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/creator/templates">
          Sell templates
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => <span key={category} className="rounded-full border px-3 py-1 text-sm">{category}</span>)}
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {builtInTemplates.map((template) => (
          <article key={template.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="aspect-[16/9] bg-gradient-to-br from-muted to-background p-5">
              <div className="flex h-full flex-col justify-between rounded-xl border bg-background/80 p-4 backdrop-blur">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{template.category}</span>
                <div>
                  <h2 className="text-xl font-semibold">{template.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{template.kind}</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => <span key={tag} className="rounded-full border px-2 py-1 text-xs">{tag}</span>)}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>{template.infographicHeavy ? "Infographic-rich" : "Clean editorial"}</span>
                <span className="font-medium">Included</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

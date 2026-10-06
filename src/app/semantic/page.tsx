import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

const features = [
  ["Semantic graph", "Represent facts, claims, metrics, sources, visuals, people, products and reusable components as linked nodes."],
  ["Linked metrics", "Define authoritative KPIs once and bind them into decks, reports, dashboards and spreadsheets."],
  ["Data lineage", "Trace each number or visual back to its source, transformation and observation time."],
  ["Cross-artifact consistency", "Detect conflicting prices, KPIs, counts and claims across outputs that should agree."],
  ["Live component reuse", "Keep approved company descriptions, KPI blocks, legal text and branded components synchronized."],
  ["Freshness tracking", "Mark linked sources and metrics fresh, stale, unknown or failed before publishing."],
  ["Pre-publish gate", "Combine evidence, freshness, accessibility, brand, consistency and classification checks into one release gate."],
  ["Template remix", "Mix layout, typography and visual systems without copying executable code from third-party templates."],
  ["Brand extraction", "Extract palette, typography and logo candidates from supplied HTML/CSS/brand text."],
  ["Classification", "Support Public, Internal, Confidential and Restricted artifact classifications and watermark rules."],
  ["Fingerprinting", "Hash template structure/styles and visual assets for originality checks and marketplace protection."],
  ["Semantic search", "Search approved workspace knowledge by concept keys, labels and content rather than only filenames."],
];

export default async function SemanticWorkspacePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Universal semantic canvas</p>
          <h1 className="text-4xl font-semibold tracking-tight">Edit the meaning once. Update every output.</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Presentations, documents, dashboards, infographics, posters and social cards can share the same governed facts,
            metrics, components, data lineage and quality policies.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border px-4 py-2 text-sm font-medium" href="/intelligence">Intelligence</Link>
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/studio">Open Studio</Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map(([title, description]) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Shared-content propagation model</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A semantic metric or fact can have many artifact bindings. Updating its node increments its version and returns
          the affected artifact/element/property bindings, allowing clients or workflows to refresh only the dependent content.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {["Source", "Semantic node", "Artifact bindings", "Quality gate"].map((label, index) => (
            <div key={label} className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground">0{index + 1}</div>
              <div className="mt-2 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

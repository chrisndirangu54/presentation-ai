import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { targetSpecs } from "@/lib/layout/engine";

const labels: Record<string, string> = {
  "deck-16x9": "Presentation 16:9",
  "deck-4x3": "Presentation 4:3",
  "a4-portrait": "A4 Portrait",
  "a4-landscape": "A4 Landscape",
  "dashboard-desktop": "Desktop Dashboard",
  mobile: "Mobile",
  infographic: "Infographic",
  "poster-a3": "A3 Poster",
  "social-square": "Social Square",
  "social-portrait": "Social Portrait",
  "social-story": "Social Story",
};

export default async function AdaptiveLayoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <main className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Adaptive rendering</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            One semantic canvas, many intelligent layouts
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Reflow the same governed content across presentation, print, dashboard,
            mobile, infographic, poster and social formats while preserving hierarchy,
            brand tokens and safe areas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border px-4 py-2 text-sm font-medium" href="/semantic">
            Semantic Canvas
          </Link>
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/studio">
            Open Studio
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(targetSpecs).map(([target, spec]) => (
          <article key={target} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{labels[target] ?? target}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {spec.width} × {spec.height}
                </p>
              </div>
              <span className="rounded-full border px-2 py-1 text-xs">
                {spec.columns} cols
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">Margin</div>
                <div className="mt-1 font-medium">{spec.margin}px</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">Gap</div>
                <div className="mt-1 font-medium">{spec.gap}px</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">Text budget</div>
                <div className="mt-1 font-medium">{spec.maxTextChars}</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-xs text-muted-foreground">Density</div>
                <div className="mt-1 font-medium">
                  {Math.round(spec.preferredDensity * 100)}%
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Adaptive rules</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Semantic priority", "Metrics, visuals and section anchors are placed before lower-priority supporting copy."],
            ["Responsive transformation", "Dense tables or text can be split or compressed for mobile and social targets."],
            ["Brand constraints", "Typography, spacing, radius and palette tokens travel with every generated layout."],
            ["Quality audit", "Generated layouts are checked for overlap, safe-area breaches, density and overflow."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-xl border p-4">
              <div className="font-medium">{title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
